# Vercel production deployment status — 2026-05-19

## Result

- EDC deployed: `https://continium-edc.vercel.app` (`dpl_B1gxEqwnJnB6ZnXHWKRhhaPKr5Y6`)
- License server deployed: `https://continium-license-server.vercel.app` (`dpl_6B4ktEXCu9cL15TvNyvy3mju2iz7`)

## Verified

- EDC `/` returns 200.
- EDC `/auth/signup` returns 200.
- License server `/` returns 200.
- License admin endpoint without bearer returns 401.
- Local builds pass:
  - `pnpm --filter @continium/web build`
  - `pnpm --filter @continium/license-server build`
  - `pnpm --filter @continium/surveys build`
  - `pnpm --filter @continium/js-core build`
- Targeted tests pass:
  - `pnpm --filter @continium/web exec vitest run modules/survey/list/lib/survey-page.test.ts --reporter=dot`
  - `pnpm --filter @continium/license-server test`
  - `pnpm --filter @continium/license-server typecheck`
- Code review critical finding fixed: clinical data-entry now filters unauthorized instruments before record/value queries.
- SDK survey `name` is now selected and included in the public survey schema instead of being type-only.

## Blocked

- License `/api/health` returns `{ "status": "degraded", "db": "down" }`.
- EDC production env still has placeholder `DATABASE_URL` and `DIRECT_URL`.
- Local license `LICENSE_DATABASE_URL` is not public and cannot be used by Vercel.
- Quota admission still has a known concurrent submission race from review; address before real public traffic if quotas are part of launch scope.

## Next

1. Provision hosted Supabase Postgres for EDC and license server.
2. Set Vercel production DB env vars from the hosted URLs.
3. Run migrations for both databases.
4. Redeploy both projects.
5. Seed demo license, set EDC cloud-mode env, redeploy EDC.
6. Run Phase 7 manual QA.

## Open questions

- Which Supabase account/project should own the hosted EDC and license databases?
