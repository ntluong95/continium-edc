---
phase: 4
title: "Deploy Continium EDC app"
status: deployed-db-smoke-blocked
priority: P1
effort: "1d"
dependencies: [2, 3]
---

# Phase 4: Deploy Continium EDC app

## Current status — 2026-05-19

- Vercel production deploy succeeded and is aliased at `https://continium-edc.vercel.app`.
- Verified smoke: `/` returns 200; `/auth/signup` returns 200.
- **CI/CD fixed**: GitHub push was failing because Vercel's auto-deploy from GitHub used code that diverged from the successful `vercel deploy` (done by Codex from local). Fixed by:
  - Added `continium/vercel.json` with `"git": { "deploymentEnabled": false }` to disable Vercel's GitHub auto-deploy.
  - Created `.github/workflows/migrate-and-deploy-free-tier.yml` to run migrations then `vercel deploy --prod` from GitHub Actions on every push to `main`.
- **DB env vars added**: `DATABASE_URL` and `DIRECT_URL` are now in Vercel from Supabase. Migrations will run on next push to `main`.
- Pending: first migration run, DB-backed smoke flow (registration → org → project → invite).

## Overview

Deploy the public `continium-edc` repo to Vercel Hobby for a $0, public demo. **User-confirmed correction:** Render free is not deploy-ready for the acceptance criteria because it blocks outbound SMTP ports and does not provide a free Background Worker. Vercel Hobby can use the current SMTP path, while pg-boss worker-backed flows are explicitly deferred for the $0 demo.

## Context links

- Phase 2 (build/start prep) artefacts
- Phase 3 (DB + Redis connection strings)
- [`deployment/env.continium-edc.example`](../../deployment/env.continium-edc.example)
- [`deployment/free-deployment-checklist.md`](../../deployment/free-deployment-checklist.md) — operator runbook

## Requirements

### Functional

- Public URL reachable over HTTPS (e.g. `https://continium-edc.vercel.app`).
- Migrations applied before traffic is served.
- Public registration enabled. New visitor → register → email verify → log in → create org → create project → create environments → invite teammate.
- File uploads work (R2 bucket — Phase 6's stretch; or skip uploads on first demo).
- Email works via Brevo SMTP on Vercel Hobby. Existing code uses SMTP; keep Render free as fallback only if an HTTPS email adapter is added.
- Background worker strategy chosen. For the $0 demo, pg-boss worker-backed flows are deferred rather than simulated.

### Non-functional

- TLS automatic via the platform.
- Build through Vercel succeeds with the monorepo root and `apps/web` project path.
- Vercel function max duration stays within Hobby limits.
- No background-worker dependency blocks registration, invites, org/project creation, or normal/clinical smoke flows.

## Architecture

### Recommended primary: Vercel + Supabase + Upstash + R2 + GitHub Actions migrations

```
Vercel project : continium-edc
Framework      : Next.js
Root directory : apps/web
Install command: pnpm install --frozen-lockfile
Build command  : pnpm --filter @continium/database generate && pnpm --filter @continium/web build
Output dir     : .next
Plan           : Hobby
```

Vercel caveats:

- Vercel Hobby **TOS prohibits commercial/revenue use** — fine for an unmonetized demo, not acceptable once the project earns money.
- No background workers — pg-boss flows are deferred for the $0 demo.
- Migrations must run from CI before deployment.

### Fallback: Render only after transport changes

Render remains a fallback if you later add an HTTPS email API sender or move email off-platform. Do not use Render free with the current SMTP-only email path.

### Domain

- For now: use the Vercel-issued URL (`*.vercel.app`).
- Later (Phase 8): swap to `app.continium.com` when the domain is acquired.

### CI: GitHub Actions deploy + migrate flow

```
.github/workflows/migrate-and-deploy-free-tier.yml

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    env:
      DIRECT_URL: ${{ secrets.DIRECT_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: '20.18' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @continium/database migrate:deploy

  deploy:
    needs: migrate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm dlx vercel deploy --prod --yes --token "$VERCEL_TOKEN"
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

Disable Vercel's automatic Git deployment for this project or use the workflow as the authoritative path so migrations finish before production deployment.

## Related code files

Repo-level config:

- `.github/workflows/migrate-and-deploy-free-tier.yml`
- `apps/web/vercel.json`
- `deployment/env.continium-edc.example`

## Implementation steps

1. **Create a Vercel Hobby project** for `continium-edc` with root directory `apps/web`.
2. **Set env vars** in Vercel from [`deployment/env.continium-edc.example`](../../deployment/env.continium-edc.example). Copy connection strings from Phase 3.
3. **Start in self-hosted mode**: `CONTINIUM_EDITION=selfHosted`, empty `CONTINIUM_LICENSE_SERVER_URL`, empty `ENTERPRISE_LICENSE_KEY`.
4. **Add GitHub secrets**: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `DIRECT_URL`, and any migration/runtime secrets the workflow requires.
5. **Commit/use `.github/workflows/migrate-and-deploy-free-tier.yml`** as the gated deploy path.
6. **Trigger first deploy** from GitHub Actions. Watch the migration and Vercel deploy logs.
7. **Verify**:
   - Build & deploy succeed in Vercel Dashboard.
   - Migrations applied (`psql $DIRECT_URL -c "\dt"` shows tables).
   - `https://continium-edc.vercel.app/api/health` returns 200.
   - Open the public URL — landing page renders.
8. **Smoke flow (manual)**:
   - Register a brand-new user → check Brevo SMTP inbox for verification email → click link → log in.
   - Create organization.
   - Create project.
   - Create development + production environments.
   - Invite another email → log in as that email in incognito → accept.
9. **Do not create a pg-boss worker for the $0 demo.** Document deferred worker-backed flows in the checklist. Add a paid worker only in a later phase.
10. **Tag** `v0.1.0-staging` in the repo when end-to-end smoke succeeds.

## Success criteria

- [x] Public URL serves the landing page over HTTPS.
- [x] CI/CD workflow committed and Vercel auto-deploy disabled.
- [ ] GitHub secrets set (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `DATABASE_URL`, `DIRECT_URL`).
- [ ] Migrations applied on first successful CI run.
- [ ] `/api/health` returns 200.
- [ ] User can register → verify → log in → create org → create project → invite teammate → submit a normal form response.
- [ ] Deferred worker-backed flows are documented and not part of the public demo acceptance gate.
- [ ] No 5xx errors during smoke flow (check Vercel logs).
- [ ] Free-tier / no-PHI demo banner visible on the public URL.

## Risk assessment

| Risk                                      | Likelihood          | Impact | Mitigation                                                                    |
| ----------------------------------------- | ------------------- | ------ | ----------------------------------------------------------------------------- |
| Vercel Hobby commercial-use limit         | High once monetized | High   | Use only for an unmonetized demo; migrate before paid plans or hosted revenue |
| No always-on worker on Vercel Hobby       | Certain             | Medium | Defer pg-boss worker-backed flows; add paid worker or refactor jobs later     |
| Supabase pauses after idle                | High                | Medium | Communicate expectation; warm before demos; upgrade when public usage grows   |
| Build/deploy mismatch from monorepo root  | Medium              | Medium | Keep Vercel project root `apps/web`; run CI workflow from repo root           |
| SMTP deliverability without custom domain | Medium              | Medium | Expect spam-folder checks; add SPF/DKIM/DMARC once domain is acquired         |

## Security considerations

- Strong `NEXTAUTH_SECRET` (32+ random bytes from `openssl rand -hex 32`).
- `NEXTAUTH_URL` matches the actual public URL exactly (or login callbacks break).
- Enable `TURNSTILE_*` or `RECAPTCHA_*` to prevent registration abuse on a public URL.
- Set `RATE_LIMITING_DISABLED` to 0 (i.e. **enabled**).
- Health endpoint must not leak version / commit / env data.

## Next steps

- Phase 5: deploy license server, then switch EDC `CONTINIUM_EDITION` to `cloud` and re-test.
- Phase 6: complete email provider wiring; verify invitation emails arrive.
- Phase 7: full QA flow including clinical project + license verification.
