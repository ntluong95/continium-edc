---
title: "Production deployment on free services"
description: "Public AGPL Continium EDC + separate private licensing server, deployed to free-tier services for testing and early public availability"
status: in-progress
priority: P1
created: 2026-05-18
owner: ntluong95
scope: project
blockedBy: [260517-1605-continium-licensing-refactor]
blocks: []
---

# Production deployment on free services

> **Planning-only.** No runtime code changes in this plan. Output is in `deployment/` and `plans/260518-1530-production-free-services-deployment/`.

## Overview

Prepare Continium EDC (Formbricks-derived clinical EDC, AGPLv3) and a separate private licensing server for a public, production-style deployment using free cloud services. Goals: anyone can register → create org → create project → create environments → invite teammates → run normal + clinical forms → transactional email works → license/entitlement check works → swap to paid stack later without rewrites.

## Why now

- Public early-validation requires a real URL the team can hand out (no localhost demos).
- Free tiers acceptable for **testing and demos only**; not for real patient data.
- Two-repo separation (`continium-edc` public AGPL + `continium-license-server` private) is a prerequisite for any commercial licensing motion later and for clean AGPL posture.
- Existing in-tree `apps/license-server/` must be extracted to a separate private repo before public publication of `continium-edc`.

## Cross-plan dependency

This plan **builds on**, but does not replace, [`260517-1605-continium-licensing-refactor`](../260517-1605-continium-licensing-refactor/plan.md). That plan sever entitlements from `apps/web/modules/ee/` but keeps the EE tree in-place. **This plan requires the EE tree to be physically removed from the public repo.** If the licensing refactor has not landed, complete it first (or scope-extend it inside this plan's Phase 1). The two plans must not run concurrently against the same files.

## Master deliverables (user-facing, ship to repo)

- [`deployment/production-free-services-plan.md`](../../deployment/production-free-services-plan.md) — single-document deployment plan (arch + steps + risks)
- [`deployment/env.continium-edc.example`](../../deployment/env.continium-edc.example) — full env-var matrix, public app
- [`deployment/env.license-server.example`](../../deployment/env.license-server.example) — full env-var matrix, license server
- [`deployment/free-deployment-checklist.md`](../../deployment/free-deployment-checklist.md) — operator runbook
- [`deployment/future-production-hardening.md`](../../deployment/future-production-hardening.md) — paid migration path

## Phases

| Phase | Name                                                                                             | Status                                                                     | Priority | Effort |
| ----- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | -------- | ------ |
| 1     | [Repository separation & licensing safety](./phase-01-repository-separation-licensing-safety.md) | In Progress                                                                | P1       | 1.5d   |
| 2     | [Prepare app for production](./phase-02-prepare-app-for-production.md)                           | Complete                                                                   | P1       | 1d     |
| 3     | [Provision database & Redis](./phase-03-provision-database-redis.md)                             | Complete (Supabase URLs provisioned; env vars added to Vercel 2026-05-19)  | P1       | 0.5d   |
| 4     | [Deploy Continium EDC app](./phase-04-deploy-continium-edc-app.md)                               | In Progress (deployed; CI/CD workflow created; migrations pending first run) | P1       | 1d     |
| 5     | [Deploy licensing server](./phase-05-deploy-licensing-server.md)                                 | In Progress (deployed; license DB URL added; migrations + seed pending)    | P1       | 0.75d  |
| 6     | [Email service setup](./phase-06-email-service-setup.md)                                         | In Progress (SMTP strategy complete; live smoke pending)                   | P2       | 0.5d   |
| 7     | [Production-like QA](./phase-07-production-like-qa.md)                                           | Pending (blocked by Phase 4+5 migration smoke)                             | P1       | 1d     |
| 8     | [Future paid production migration](./phase-08-future-paid-production-migration.md)               | Future                                                                     | P3       | —      |

Total effort (Phases 1–7): ~6 days for a solo engineer with prior Next.js/Prisma deploy experience.

## Recommended free stack (summary)

| Concern                     | Service                                                                           | Free allowance                                                                          | Risk                                                            |
| --------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Continium EDC web           | **Vercel Hobby**                                                                  | Free for non-commercial personal use; SMTP 587 works with current email code; no worker | Use only for unmonetized demo; migrate before commercialization |
| Primary Postgres + pgvector | **Supabase** (free)                                                               | 500 MB, pgvector, 1-week inactivity pause                                               | Pause adds ~5–10s cold start; clinical data not allowed         |
| Redis / rate-limit          | **Upstash Redis** (free)                                                          | 256 MB, 500K cmds/mo, REST + TCP                                                        | Caps low; OK for early traffic                                  |
| Object storage              | **Cloudflare R2** (free)                                                          | 10 GB storage, **zero** egress fees                                                     | Best long-term home; S3-compatible                              |
| Transactional email         | **Brevo** (free)                                                                  | 300/day, no domain required                                                             | SMTP works on selected Vercel Hobby app host                    |
| Licensing server            | **Vercel Hobby** (free)                                                           | Node serverless; 100 GB bandwidth class on Hobby                                        | Fair-use TOS bars commercial revenue; OK for non-revenue        |
| Licensing DB                | **Supabase** (separate project)                                                   | 500 MB shared free                                                                      | Two free projects max per Supabase org                          |
| Cron / scheduled            | **GitHub Actions** + cron-job.org → `${WEBAPP_URL}/api/cron/*` with `CRON_SECRET` | Free for public repos                                                                   | Does not replace pg-boss without implementation changes         |

Justification, alternatives, and risks — see [`deployment/production-free-services-plan.md`](../../deployment/production-free-services-plan.md) §"Free service options comparison".

## Acceptance criteria (plan-level)

- [ ] Two-repo strategy documented (`continium-edc` public AGPL, `continium-license-server` private original code).
- [ ] No `apps/web/modules/ee/` code in the public repo (or a legally-reviewed exception list).
- [ ] Public registration → org → project → environments → invite → form submit works on free-tier URL.
- [ ] License-server health/check endpoints reachable from EDC; cloud + selfHosted modes both verified.
- [ ] Five `deployment/*` deliverables exist and are consistent.
- [ ] PHI/clinical-data warning visible in repo README and in `deployment/production-free-services-plan.md`.

## Open questions

1. ~~**Removing `modules/ee/` entirely** (this plan) vs **keeping but unused** (260517 plan).~~ **Decided: Remove entirely.** Phase 1 is blocked until the `260517-1605-continium-licensing-refactor` plan (160+ import sites) is complete.
2. **EE LICENSE attribution** in `apps/web/modules/ee/LICENSE` claims Continium GmbH copyright on Formbricks EE code — needs counsel review before public repo publication.
3. **Cron-secret distribution** for free stack: GitHub Actions secret vs cron-job.org header — both work; pick one.
4. **License-server domain** for now: Vercel `*.vercel.app` is fine; flag rotation when `license.continium.com` is acquired.
5. **PHI policy** in README — recommend explicit "do not store identifiable patient data on free-tier infra" banner.

## Implementation decisions (user-confirmed)

| Decision          | Choice                                                                    |
| ----------------- | ------------------------------------------------------------------------- |
| EE folder         | Remove entirely (Phase 1, after licensing-refactor completes)             |
| Email strategy    | Vercel Hobby (SMTP port 587 allowed; no adapter needed)                   |
| Background worker | Defer pg-boss flows for $0 demo                                           |
| License contract  | `cloud` mode implemented — active license → all features; inactive → free |
| App host          | Vercel Hobby (not Render; avoids SMTP blocker)                            |

## Status notes

- Code changes landed in this session:
  - `packages/continium-licensing/src/plans.ts` — added `cloud` edition
  - `packages/continium-licensing/src/entitlements.ts` — added `"cloud"` source type
  - `apps/web/modules/continium/licensing/lib/get-continium-entitlements.ts` — cloud resolver
  - `apps/web/lib/env.ts` — `CONTINIUM_LICENSE_SERVER_URL` made optional
  - `apps/web/vercel.json` — Hobby plan max-duration cap + empty crons
  - `apps/license-server/vercel.json` — created for Vercel Hobby deployment
  - `.github/workflows/migrate-and-deploy-free-tier.yml` — CI migrate + deploy
  - `docker-compose.dev.yml` — REMOVE-IN-PUBLIC-REPO comment added
  - `deployment/env.continium-edc.example` — updated for Vercel + cloud mode
  - `deployment/env.license-server.example` — admin route ref corrected
- **2026-05-19 CI/CD fix**: Vercel auto-deploy from GitHub was causing build failures (code mismatch between local and GitHub). Fixed by:
  - Created `.github/workflows/migrate-and-deploy-free-tier.yml` — migrations then `vercel deploy --prod` via GitHub Actions.
  - Created `continium/vercel.json` with `"git": { "deploymentEnabled": false }` — prevents Vercel from auto-deploying on GitHub push (only GitHub Actions deploys now).
  - Merged `migrate-to-newhouse` into `main`; pushed to GitHub.
- **DB env vars added to Vercel (2026-05-19)**: Both `DATABASE_URL`/`DIRECT_URL` (EDC) and `LICENSE_DATABASE_URL` (license server) are now set in Vercel. Migrations will run on next push to main via GitHub Actions.
- **Pending operator actions** (Phase 5, 6, 7): seed demo license, configure Brevo SMTP, run Phase 7 QA.
- **Pending Phase 1 blocker**: `apps/web/modules/ee/` cannot be removed until `260517-1605-continium-licensing-refactor` is complete (160+ import sites).
- 2026-05-19 deploy attempt:
  - EDC deployed and aliased: `https://continium-edc.vercel.app` (`dpl_B1gxEqwnJnB6ZnXHWKRhhaPKr5Y6`).
  - License server deployed and aliased: `https://continium-license-server.vercel.app` (`dpl_6B4ktEXCu9cL15TvNyvy3mju2iz7`).
  - Smoke passed: EDC `/` 200, EDC `/auth/signup` 200, license server `/` 200, license admin without bearer 401.
  - Smoke blocked: license server `/api/health` returns `{ "status": "degraded", "db": "down" }`; Vercel EDC `DATABASE_URL`/`DIRECT_URL` are still placeholder values, and local license DB URL is not public. Provision Supabase URLs, run migrations, then redeploy.
  - Code review critical finding fixed after first deploy: clinical data-entry authorization now filters unauthorized instruments before querying records/values, and EDC was redeployed.

## Red Team Review

### Accepted Findings

| Severity | Finding                                                                                                              | Evidence                                                                                                                                                         | Plan delta                                                                                                                     |
| -------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Critical | Render free + Brevo SMTP cannot satisfy registration/invite email acceptance criteria.                               | Render free docs block outbound `25/465/587`; current email code uses `nodemailer` SMTP in `apps/web/modules/email/index.tsx`.                                   | User chose non-Render app host: Vercel Hobby, where SMTP 587 works.                                                            |
| Critical | The plan claimed a free Render Background Worker, but Render free does not support Background Worker free instances. | Render free docs list Web/Postgres/Key Value only; Blueprint docs say `free` is not available for background workers.                                            | Plan now treats pg-boss worker as paid/alternate/deferred, not $0.                                                             |
| Critical | Proposed cloud license contract did not match current code.                                                          | Current routes are `/api/licenses/check` and `/api/admin/licenses`; legacy web check uses `ENTERPRISE_LICENSE_KEY`.                                              | Implemented `CONTINIUM_EDITION=cloud` in the Continium entitlement resolver; current key env remains `ENTERPRISE_LICENSE_KEY`. |
| High     | License server is not Edge-ready on Vercel.                                                                          | Current route imports Prisma and `node:crypto`; no Edge runtime export.                                                                                          | Phase 5 now describes Node serverless and requires pooling-safe DB URL.                                                        |
| High     | `CONTINIUM_LICENSE_SERVER_URL=` empty in self-hosted example conflicted with env schema.                             | Earlier `apps/web/lib/env.ts` required `CONTINIUM_LICENSE_SERVER_URL: z.string().url()`.                                                                         | Implemented optional `CONTINIUM_LICENSE_SERVER_URL`; required only in cloud mode.                                              |
| Medium   | Several free-tier claims were too absolute or stale.                                                                 | Render has 5 GB included outbound bandwidth and service-initiated traffic thresholds; R2 has operation limits despite free egress; Supabase free egress is 5 GB. | Tables corrected; "free forever" language removed.                                                                             |

### Whole-Plan Consistency Sweep

- Updated `deployment/production-free-services-plan.md`, `deployment/env.continium-edc.example`, `deployment/env.license-server.example`, Phase 4, and Phase 5 for the accepted findings.
- Remaining contradiction: research reports still contain the original service-provider assertions. Treat them as raw research inputs, not authoritative implementation instructions.
- `/ck:cook` has run. See "Implementation decisions" and "Status notes" above for what landed.
