# `@continium/web`

The Next.js application that hosts the Continium clinical EDC and the
Formbricks-derived form surface. This README covers local development
commands, the test layout, and CI considerations specific to this app.
Repository-wide guidelines live in `../../README.md` and `../../CLAUDE.md`.

---

## Development

```bash
pnpm dev          # Next.js dev server on :3000 (Turbopack)
pnpm build        # Production build (NODE_OPTIONS sets a larger heap)
pnpm start        # Serve the production build
pnpm lint         # ESLint --fix across .ts/.tsx/.js/.jsx
```

The dev server reads `../../.env` via `dotenv-cli`. Database URL,
Postgres role, S3 / file-storage secrets, and the cron secret all live
there — never commit them to git.

---

## Testing

Two layers exist, separated by filename glob so the fast unit suite is
not blocked on database availability.

| Layer | Filename pattern | Runner | Needs DB? |
|---|---|---|---|
| Unit | `*.test.ts` / `*.test.tsx` | `pnpm test` | No |
| Integration | `*.integration.test.ts` / `*.integration.test.tsx` | `pnpm test:integration` | Yes (today's integration tests are pure logic but the glob is reserved for DB-backed work) |
| Both | (combined) | `pnpm test:all` | Yes |

### Commands

```bash
pnpm test                       # Unit suite. Sub-3-second cold-cache.
pnpm test:integration           # Integration suite (single-threaded, 30s test timeout).
pnpm test:all                   # Unit + integration sequentially.
pnpm test:coverage              # V8 coverage across the entire app. Output: ./coverage/
pnpm test:coverage:clinical     # Coverage scoped to modules/clinical/** only.
```

`pnpm test` runs `vite.config.mts`, which excludes
`**/*.integration.test.ts` from the include glob. `pnpm test:integration`
runs `vite.config.integration.mts`, which only includes
`**/*.integration.test.ts`. Add the `.integration.test.ts` suffix to any
new test file whose preconditions include a populated DB, a Postgres
trigger fire, an HTTP server, or a wall-clock time budget over 5
seconds.

### Test layout convention

```
modules/clinical/<feature>/
  lib/
    something.ts                    # implementation
    something.test.ts               # unit — vitest, no DB
    something.integration.test.ts   # integration — vitest, DB or wider setup
```

The same convention applies to `lib/`, `app/`, and `modules/api/`. Avoid
moving tests to a parallel `tests/` tree — colocation is the project's
default.

### Setup

`vitestSetup.ts` mocks `next-auth/react`, `useSignOut`, `ResizeObserver`,
and the `ValidationError` constructor's stack-trace handling so React
components render without a real session. Adding a global mock should be
rare; prefer per-file `vi.mock(...)` so unrelated tests do not inherit
hidden behaviour.

### Clinical coverage strategy

Clinical code under `modules/clinical/**` is the highest-risk surface in
the app (regulatory + data integrity). Pin behaviour at three layers:

1. **Pure logic** — value coercion, status machine, eligibility
   predicate, rule resolver. Unit tests with no Prisma.
2. **Service entry points** — `clinical-record-service.ts`,
   `clinical-template-service.ts`, `clinical-response-sync.ts`. Unit
   tests with a mocked `ClinicalTx`. Pin the transactional contract:
   what the service writes, what it reads, what it logs.
3. **End-to-end** — exposed via `*.integration.test.ts` once a real DB
   is available in CI. Targets:
   - DAG isolation (User A in DAG1 cannot read Subject in DAG2).
   - Record-lock blocks cell input server-side, not just in the UI.
   - Concurrent publish of the same survey hash yields one Instrument.
   - `UPDATE audit_log` raises (trigger `audit_log_no_update`).

Track the clinical coverage number with
`pnpm test:coverage:clinical`. Do not let it regress on a feature PR.

---

## CI

CI runs `pnpm test` (unit) on every PR. The integration job runs on
push to `main` and on PRs that touch:

- `modules/clinical/**`
- `packages/database/**`
- `app/api/**`
- `lib/response/**`

The integration job brings up a Postgres container, applies migrations
via the custom runner (NOT `prisma migrate deploy` — see
`../../packages/database/README.md`), and runs `pnpm test:integration`.
A test that needs a DB but is not tagged `.integration.test.ts` will
silently fail in the integration job because its setup hooks will never
fire.

### Coverage gating

We do not currently gate PRs on a coverage threshold. Coverage is a
visibility tool, not a quality bar. The clinical baseline lives in
`changes/refactor-priority-matrix.md` and is reviewed quarterly.

---

## Storybook

```bash
pnpm --filter @continium/storybook dev
```

Stories for shared UI primitives live under `apps/storybook/`; clinical
UI components are not currently published as stories.

---

## Behavior changes from upstream

### Clinical record `INCOMPLETE → LOCKED` direct transition

Removed in commit (see the B2 entry in
`changes/refactor-pr-breakdown.md`). Records must be promoted to
`COMPLETE` before they can be locked. The UI `Lock` button is disabled
unless the record is `COMPLETE`; the server-side state machine rejects
the transition.

If a coordinator needs to halt data entry on an incomplete record, use
the access-rule layer (`/clinical/access`) to revoke write permission
rather than locking the record. Locking is the audit seal that follows
data cleaning, not an early kill switch.
