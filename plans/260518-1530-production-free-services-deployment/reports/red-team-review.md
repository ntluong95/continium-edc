---
type: red-team-review
created: 2026-05-18
plan: ../plan.md
status: applied
---

# Red Team Review — Production Free Services Deployment

## Summary

Plan had good structure, but three assumptions would break first deployment: Render free cannot send SMTP, Render free has no Background Worker, and the proposed Continium cloud-license contract did not match current code. Initial corrections were plan-only. Later `/ck:cook` work implemented cloud mode and Vercel deploy config.

## Findings

| Severity | Finding                                                      | Evidence                                                                                                                                                  | Disposition                          |
| -------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Critical | Render free + Brevo SMTP cannot satisfy transactional email. | Render free blocks outbound SMTP ports `25`, `465`, `587`; `apps/web/modules/email/index.tsx` uses `nodemailer` SMTP only.                                | Accepted                             |
| Critical | No free Render Background Worker.                            | Render free docs list Web/Postgres/Key Value; Render Blueprint says `free` unavailable for background workers.                                            | Accepted                             |
| Critical | License API plan mismatches current implementation.          | Current server has `/api/licenses/check` and `/api/admin/licenses`; web legacy client posts to `/api/licenses/check`; `@continium/licensing` is env-only. | Accepted                             |
| High     | `CONTINIUM_EDITION=cloud` was not a valid edition.           | `packages/continium-licensing/src/plans.ts` previously defined only `free` and `selfHosted`.                                                              | Accepted; implemented in `/ck:cook`  |
| High     | Empty `CONTINIUM_LICENSE_SERVER_URL` failed env validation.  | Earlier `apps/web/lib/env.ts` required a URL.                                                                                                             | Accepted; optionalized in `/ck:cook` |
| High     | Vercel Edge claim false for license server.                  | Route imports Prisma and `node:crypto`; no Edge runtime export.                                                                                           | Accepted                             |
| Medium   | Free-tier tables too absolute.                               | Render bandwidth is limited, R2 operations are metered, Supabase free egress is 5 GB.                                                                     | Accepted                             |

## Applied Changes

- Corrected deployment recommendation language in `deployment/production-free-services-plan.md`.
- Updated EDC and license-server env examples.
- Updated Phase 4 for email and worker blockers.
- Updated Phase 5 for current license routes, env names, and Vercel runtime reality.
- Added `## Red Team Review` to `plan.md`.

## Unresolved Questions

1. EE removal still waits on the 260517 licensing-refactor plan.
2. Live smoke tests still require operator-created Supabase, Upstash, Brevo, and Vercel resources.
