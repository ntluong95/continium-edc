---
phase: 1
title: "Repository separation & licensing safety"
status: pending
priority: P1
effort: "1.5d"
dependencies: []
---

# Phase 1: Repository separation & licensing safety

## Overview

Split the current monorepo into two repos:

1. **`continium-edc`** — public, AGPLv3. Web app + worker + supporting `@continium/*` packages. **No** `apps/license-server/` and **no** `apps/web/modules/ee/`.
2. **`continium-license-server`** — private, original code. Extracted from `apps/license-server/` + `packages/license-generator/` + minimal shared types.

This is the only phase that touches code layout. All subsequent phases assume two repos exist.

## Context links

- Existing in-tree license server: `apps/license-server/`
- Existing in-tree EE modules: `apps/web/modules/ee/`
- Licensing refactor (must be complete first or absorbed): [`plans/260517-1605-continium-licensing-refactor/plan.md`](../260517-1605-continium-licensing-refactor/plan.md)
- AGPL notice in package: [`packages/continium-licensing/`](../../continium/packages/continium-licensing/)
- Existing README AGPL banner: `continium/README.md`

## Requirements

### Functional

- Public repo builds & boots **without** importing anything from `apps/license-server/`, `packages/license-generator/`, or `apps/web/modules/ee/`.
- Private repo builds & boots **without** importing anything from `apps/web/` (the public app's source).
- Both repos share an "API contract" — defined in `packages/continium-licensing/src/contracts/` and duplicated into both (vendored, not as a workspace package), or published to a private npm registry. **Decision deferred** to Phase 5 — for now, vendor the schema.
- Public repo runs in `CONTINIUM_EDITION=selfHosted` mode without the license server (current code path).
- Public repo can be pointed at the license server with `CONTINIUM_EDITION=cloud` after the license server is deployed; the current bridge still uses the legacy `ENTERPRISE_LICENSE_KEY` env until a future Continium-specific key rename lands.

### Non-functional

- Public repo history must not contain secrets — re-create as a fresh repo with `git init` from the cleaned working tree, OR use `git filter-repo` to scrub. **Recommended:** fresh `git init` for the public repo since the current repo is private.
- Both repos have an `LICENSE` file:
  - Public: `LICENSE` = AGPLv3 (same as existing `continium/LICENSE`).
  - Private: `LICENSE` = "All rights reserved" or a commercial license placeholder.
- Public repo `README.md` includes Formbricks attribution + AGPL summary + "no PHI on free tier" banner.
- No `.env`, `.env.local`, `.env.production`, `.env.test`, or any `*.pem` / `*.key` file in any repo's git history.

## Architecture

### Public repo (`continium-edc`) layout

```
continium-edc/
├── apps/
│   ├── web/                          # Next.js 16 app
│   ├── worker/                       # pg-boss worker
│   └── storybook/                    # design-system playground
├── packages/
│   ├── ai/
│   ├── audit/
│   ├── cache/
│   ├── config-eslint/
│   ├── config-prettier/
│   ├── config-typescript/
│   ├── continium-licensing/          # AGPL — package definition + client
│   ├── database/
│   ├── email/
│   ├── i18n-utils/
│   ├── jobs/
│   ├── js-core/
│   ├── logger/
│   ├── storage/
│   ├── survey-ui/
│   ├── surveys/
│   ├── types/
│   └── vite-plugins/
├── charts/
├── docker/
├── docs/                             # excludes /docs/self-hosting/ee/*
├── migration/
├── deployment/                       # this plan's deliverables
├── docker-compose.dev.yml            # **without** license-postgres / license-server
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
├── LICENSE                           # AGPLv3
├── README.md
└── SECURITY.md
```

**Removed from public repo:**

- `apps/license-server/`
- `packages/license-generator/`
- `apps/web/modules/ee/` (full subtree)
- `docs/self-hosting/ee/` if any
- Any `*.test.ts` / `*.spec.ts` that references `@/modules/ee/...`

### Private repo (`continium-license-server`) layout

```
continium-license-server/
├── app/                              # extracted from apps/license-server/app/
├── lib/                              # extracted from apps/license-server/lib/
├── prisma/                           # extracted from apps/license-server/prisma/
├── sql/
├── __tests__/
├── scripts/                          # license-generator CLI absorbed here
├── docker/
├── deployment/                       # vercel.json / render.yaml / dockerfile
├── Dockerfile                        # for non-Vercel deploys
├── next.config.mjs
├── package.json                      # depends on @prisma/client, next, zod, redis only
├── tsconfig.json
├── .env.example
├── LICENSE                           # "All rights reserved" / commercial placeholder
├── README.md                         # private — usage docs for ops only
└── RUNBOOK.md                        # already exists in apps/license-server/RUNBOOK.md
```

**Vendored from current monorepo** (copy, not workspace link):

- `packages/continium-licensing/src/contracts/` — schemas only. Mark `// VENDORED FROM continium-edc — keep in sync via PR review`.
- `packages/logger/src/` — minimal logging shim. Or replace with `pino` directly.
- `packages/types/src/errors.ts` — error names.

Anything copied keeps an SPDX header pointing at the original AGPL file. The private repo's _original_ code (handlers, key generation logic, admin token rotation, instance binding) MUST NOT contain any AGPL-derived blocks — it was already written clean-room in the existing `apps/license-server/`.

### Cross-repo contract

Defined in `packages/continium-licensing/src/contracts/` (lives in public repo) and vendored in the private repo. Zod schemas for:

- `LicenseCheckRequest` — current implemented shape is `{ licenseKey, usage, instanceId? }`; future Continium v1 shape can add `version`.
- `LicenseCheckResponse` — current implemented shape is `{ data: { status, features } }`; future Continium v1 shape can add first-class Continium feature flags and signed metadata.
- `LicenseEventPayload` — for audit events sent back to license server.

## Related code files

### Files / folders to **remove** from public repo

- `apps/license-server/` (entire folder)
- `packages/license-generator/` (entire folder)
- `apps/web/modules/ee/` (entire folder)
- Any tests under `apps/web/modules/ee/__tests__/`
- `docker-compose.dev.yml` → remove `license-postgres` + `license-server` services
- `.env.example` → drop license-server admin-token env vars and any EE-only vars
- `turbo.json` → drop any task definitions referencing removed packages
- `pnpm-workspace.yaml` → already glob-based; drop will be automatic
- `package.json` (root) → drop any scripts that target license-server

### Files to **add** to public repo

- `deployment/production-free-services-plan.md`
- `deployment/env.continium-edc.example`
- `deployment/free-deployment-checklist.md`
- `deployment/future-production-hardening.md`
- Update `README.md` → add "Cloud edition / license server" section pointing at the (private) license-server URL contract

### Files to **create** in private repo

- `package.json` (renamed: `@continium-internal/license-server`)
- `README.md` (private — operator-focused)
- `LICENSE` ("All rights reserved")
- `deployment/env.license-server.example` (vendored copy of this plan's deliverable)
- `.github/workflows/deploy.yml` — Vercel/Render deploy
- All current content of `apps/license-server/` flattened to repo root

## Implementation steps

> Code changes deferred until user approves. Run order:

1. **Verify pre-condition** — `plans/260517-1605-continium-licensing-refactor` is `completed` OR run its acceptance checks now (`pnpm --filter web check:no-ee-imports`). If non-empty result, stop and complete the licensing refactor first.
2. **Create public `continium-edc` repo** on GitHub (empty, public, AGPLv3).
3. **Tarball the monorepo's `continium/` working tree** → extract to a fresh directory `continium-edc-staging/`.
4. **Delete** the three folders + tests + license-server entries from staging (see "Files / folders to remove" above).
5. **Update** `docker-compose.dev.yml`, root `.env.example`, `turbo.json`, root `package.json` to drop references.
6. **Verify** locally:
   - `pnpm install`
   - `pnpm --filter @continium/web typecheck`
   - `pnpm --filter @continium/web lint`
   - `pnpm --filter @continium/web build`
   - `rg "modules/ee|license-server" --type ts apps/web packages/` → must return zero matches outside `packages/continium-licensing/` and `deployment/`.
7. **Run secret scan** — `gitleaks detect --no-git --redact -v` on the staging tree. Resolve any flag before commit.
8. **`git init` + first commit** in staging; push to public `continium-edc` repo as `main`.
9. **Create private `continium-license-server` repo** on GitHub (empty, private).
10. **Copy** `apps/license-server/*` + `packages/license-generator/*` + vendored contracts into a `continium-license-server-staging/` directory; flatten layout per "Private repo layout" above.
11. **Update** `package.json` `name` → `@continium-internal/license-server`. Drop any `workspace:*` deps; replace with concrete versions or vendored packages.
12. **Verify** locally — same checks as step 6 for the license-server staging tree.
13. **Run secret scan** on private staging tree.
14. **`git init` + first commit**; push to private `continium-license-server` repo as `main`.
15. **Tag both repos** `v0.0.0-pre-deploy`.

## Success criteria

- [ ] Public repo `continium-edc` exists on GitHub, AGPLv3.
- [ ] Private repo `continium-license-server` exists on GitHub, private, "All rights reserved".
- [ ] `rg "modules/ee" continium-edc/` → 0 matches (excluding documentation).
- [ ] `rg "license-server|license_server|licenseServer" continium-edc/apps continium-edc/packages` → 0 matches outside `packages/continium-licensing/`.
- [ ] `gitleaks` returns clean on both staging trees.
- [ ] Both repos build & typecheck independently.
- [ ] Public repo `README.md` shows AGPL badge + Formbricks attribution + free-tier warning.
- [ ] Private repo `README.md` and `RUNBOOK.md` updated for standalone deployment.

## Risk assessment

| Risk                                                                                                        | Likelihood | Impact                     | Mitigation                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------- | ---------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/modules/ee/` still imported by non-clinical Formbricks core code (160+ files per 260517 analysis) | High       | High — public build breaks | This phase **must** complete the licensing refactor and any _other_ EE imports before EE folder can be removed. May extend scope materially. |
| Secret leaked in git history                                                                                | Medium     | High                       | Fresh `git init`, scan with `gitleaks` + `trufflehog`                                                                                        |
| Original code in license server accidentally contains AGPL-derived blocks                                   | Low        | Critical (legal)           | Diff against any Formbricks EE source pre-publication                                                                                        |
| Vendored contracts drift between repos                                                                      | Medium     | Medium                     | Add a PR-template checklist item: "If touching `contracts/`, update both repos in same PR."                                                  |
| Public repo missing files imported by what remains                                                          | Medium     | High                       | Sequence: typecheck → lint → build before publish                                                                                            |
| AGPL header obligation on package source files                                                              | Low        | Medium                     | Add SPDX `SPDX-License-Identifier: AGPL-3.0-or-later` at the top of every `.ts` in public-repo `packages/continium-licensing/src/`           |

## Security considerations

- Public repo must NOT contain `CONTINIUM_LICENSE_ADMIN_TOKEN` or any signing key. Only the _public_ verification key (if asymmetric crypto is used) belongs in the public repo's `.env.example`.
- Private repo must NOT be pushed to a public mirror.
- Both repos: `.gitignore` covers `.env`, `.env.local`, `.env.*.local`, `*.pem`, `*.key`, `coverage/`, `.next/`, `node_modules/`.
- Secret scan tool of record: `gitleaks` + `trufflehog filesystem` on staging tree before first push.

## Next steps

- Phase 2 (Prepare app for production) — happens **inside** the freshly-staged public repo.
- Phase 5 (Deploy licensing server) — happens **inside** the freshly-staged private repo.
