---
phase: 5
title: "Deploy licensing server"
status: deployed-db-health-blocked
priority: P1
effort: "0.75d"
dependencies: [1, 3]
---

# Phase 5: Deploy licensing server

## Current status — 2026-05-19

- Vercel production deploy succeeded and is aliased at `https://continium-license-server.vercel.app`.
- Added root status page so `/` no longer returns the expected API-only 404.
- Verified smoke: `/` returns 200; `/api/admin/licenses` without bearer returns 401.
- `/api/health` still returns `{ "status": "degraded", "db": "down" }` because the hosted `LICENSE_DATABASE_URL` is not provisioned. Local `.env.local` points to a non-public Postgres port and cannot be used by Vercel.
- Next required action: provision Supabase license DB, set production `LICENSE_DATABASE_URL`, run `pnpm --filter @continium/license-server db:migrate:deploy` against that DB, redeploy, then seed the demo license.

## Overview

Deploy the **private** `continium-license-server` repo to **Vercel Hobby** for a non-commercial demo. **Red-team correction applied:** current code is Node/Prisma serverless, not Edge. The public app now supports `CONTINIUM_EDITION=cloud` through the existing license-check route/env contract (`/api/licenses/check`, `/api/admin/licenses`, `ENTERPRISE_LICENSE_KEY`).

## Context links

- Private repo created in Phase 1
- Existing code base: `apps/license-server/` (now extracted to private repo root)
- Existing runbook: `apps/license-server/RUNBOOK.md`
- License DB connection string: from Phase 3
- [`deployment/env.license-server.example`](../../deployment/env.license-server.example) — created in this phase

## Requirements

### Functional

- Private repo deploys on push to `main`.
- License server reachable at a fixed Vercel URL (e.g. `https://continium-license-server.vercel.app`).
- Health endpoint `/api/health` returns `200` with `{ status: "ok", db: "up" }`.
- Current license-check endpoint `POST /api/licenses/check` validates the request body license key against the DB and returns status/features; any `/api/v1/...` route is a future compatibility layer.
- Current admin endpoint `POST /api/admin/licenses` (or CLI script) seeds an initial demo license, gated by `CONTINIUM_LICENSE_ADMIN_TOKEN`.
- EDC cloud-mode support is implemented through `apps/web/modules/continium/licensing/lib/get-continium-entitlements.ts`.
- EDC at `CONTINIUM_EDITION=selfHosted` does **not** call the license server.
- License server temporarily unavailable → EDC uses the existing cached/grace license-check behavior where available; when the license check is inactive/unavailable past grace, cloud mode falls back to the free Continium feature set (no Continium clinical features).

### Non-functional

- Vercel Node serverless cold start accepted for demo; do not claim Edge runtime unless Prisma/Node usage is removed.
- License DB runtime uses Supabase pooler or another serverless-safe pooling strategy; direct connection is reserved for migrations.
- Logs to Vercel Log Drain or Better Stack (free tier) for audit.

## Architecture

### License server deployment (Vercel Hobby)

```
Vercel project: continium-license-server
Repo          : github.com/<owner>/continium-license-server (private)
Framework     : Next.js (auto-detected, Node serverless)
Build command : pnpm db:generate && pnpm build
Output        : .next
Region        : us-east-1 (closest to majority of demo audience)
```

**Env vars** (all read from `deployment/env.license-server.example`):

- `LICENSE_DATABASE_URL` (Supabase pooler URL for serverless runtime; direct URL only for migrations if split)
- `REDIS_URL` (Upstash from Phase 3)
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (optional, lower latency from edge)
- `CONTINIUM_LICENSE_ADMIN_TOKEN` (32+ char random, generate with `openssl rand -hex 32`)
- `CONTINIUM_LICENSE_ADMIN_TOKEN_PREV` (empty unless rotating)
- `CONTINIUM_LICENSE_SIGNING_PRIVATE_KEY` — for asymmetric license tokens (if used). Currently the existing code uses Prisma-stored hashes; verify before adding.
- `LOG_LEVEL=info`
- `TZ=UTC`, `PGTZ=UTC` (boot assertion)

### Alternative deployments (rejected for primary, listed for completeness)

- **Render free web service** — same as Phase 4 host. Trade-off: spins down after 15 min idle (license check cold start would intermittently spike to 30 s — annoying for client-side license caching). **Reject**.
- **Cloudflare Workers + Hono** — fastest, cheapest, but requires rewrite (no Next.js + Prisma support). **Defer** to Phase 8 if billable traffic.
- **Supabase Edge Functions** — runs on Deno, would require port; the project is currently a Next.js app. **Reject** for now.

### Connection from EDC

EDC (Phase 4) reads in this order on each license check:

1. Local in-process memory cache (currently fixed at 1 minute) and Redis-backed fetch cache (currently fixed at 24 hours for successful fetches).
2. If cache miss in current legacy path: `POST $CONTINIUM_LICENSE_SERVER_URL/api/licenses/check` with `{ licenseKey, usage, instanceId }` body.
3. If HTTP fails: verify current fallback behavior in `apps/web/modules/license-check/lib/license.ts` before claiming self-hosted fallback.

`@continium/licensing` remains pure and env-based. The Next.js web app bridges cloud mode by calling the existing `getEnterpriseLicense()` cache/fallback layer and mapping active license status to Continium entitlements.

### License-check contract

```ts
// Current implemented request. `version` and signed response fields are future API work.
{
  licenseKey: string,          // current env ENTERPRISE_LICENSE_KEY; future CONTINIUM_LICENSE_SERVER_API_KEY after rename
  instanceId?: string,         // generated by EDC on first boot, persisted in DB
  usage: {
    responseCount: number      // integer, >= 0
  }
}

// Current implemented response
{
  data: {
    status: "active" | "expired",
    features: {
      isMultiOrgEnabled: boolean,
      projects: number | null,
      twoFactorAuth: boolean,
      sso: boolean,
      whitelabel: boolean,
      removeBranding: boolean,
      contacts: boolean,
      aiSmartTools: boolean,
      aiDataAnalysis: boolean,
      saml: boolean,
      spamProtection: boolean,
      auditLogs: boolean,
      accessControl: boolean,
      quotas: boolean
    }
  }
}
```

The current EDC cloud resolver only uses active/expired status: active maps to all Continium features on; expired, invalid, or unavailable past grace maps to no Continium features. First-class Continium feature flags are a future `/api/v1/...` route migration.

`/api/health` returns no auth required:

```ts
{ status: "ok", db: "up" } // or { status: "degraded", db: "down" } with HTTP 503
```

## Related code files

In private repo (extracted from monorepo in Phase 1):

- `app/api/health/route.ts`
- `app/api/licenses/check/route.ts`
- `app/api/admin/licenses/route.ts`
- `lib/license-store.ts`
- `lib/admin-token.ts`
- `prisma/schema.prisma`
- `prisma/migrations/`
- `scripts/seed-demo-license.ts` (write fresh — admin-token-gated)
- `vercel.json` (optional — for cron triggers if needed)

In public repo:

- `apps/web/.env.example` and `deployment/env.continium-edc.example` document the new `CONTINIUM_*` vars.
- `apps/web/modules/continium/licensing/lib/get-continium-entitlements.ts` — cloud bridge from license status to Continium entitlements.

## Implementation steps

1. **In the private `continium-license-server` repo**, generate a fresh `CONTINIUM_LICENSE_ADMIN_TOKEN`:
   ```bash
   openssl rand -hex 32
   ```
2. **Sign up for Vercel** if not already; connect GitHub; import `continium-license-server`.
3. **Set env vars** in Vercel Dashboard from `deployment/env.license-server.example`.
4. **Trigger deploy**. Wait for first successful build.
5. **Verify health**:
   ```bash
   curl https://<project>.vercel.app/api/health
   # → { status: "ok", db: "up" }
   ```
6. **Seed a demo license** using the current route:
   ```bash
   curl -X POST https://<project>.vercel.app/api/admin/licenses \
     -H "Authorization: Bearer $CONTINIUM_LICENSE_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"customerId":"continium-edc-staging","customerEmail":"ops@example.com","edition":"professional","features":{"isMultiOrgEnabled":false,"projects":3,"twoFactorAuth":false,"sso":false,"whitelabel":false,"removeBranding":false,"contacts":false,"aiSmartTools":false,"aiDataAnalysis":false,"saml":false,"spamProtection":false,"auditLogs":false,"accessControl":false,"quotas":false},"expiresAt":"2027-12-31T23:59:59Z"}'
   # → { id, keyPrefix, key: "CLN-PRO-..." }  (key printed once)
   ```
7. **Copy the key**. Today this goes into the EDC's `ENTERPRISE_LICENSE_KEY` env var. Rename to `CONTINIUM_LICENSE_SERVER_API_KEY` only after code supports it.
8. **In the EDC Vercel project**, update env:
   ```
   CONTINIUM_EDITION=cloud
   CONTINIUM_LICENSE_SERVER_URL=https://<license>.vercel.app
   ENTERPRISE_LICENSE_KEY=CLN-...
   CONTINIUM_INSTANCE_ID=<auto on boot or set manually>
   # CONTINIUM_LICENSE_CACHE_TTL_SECONDS is documented as a future target, but current code ignores it.
   ```
9. **Trigger EDC redeploy**. Verify logs show one (and only one) license-check call on first request after deploy.
10. **Verify cloud-mode features** in the EDC UI — active license enables Continium features; inactive/unavailable past grace disables Continium cloud-gated features.
11. **Test fallback**: in Vercel Dashboard, **disable** the license-server project temporarily. Hit the EDC. During cache/grace it should keep serving; after fallback expiry it should serve free Continium entitlements without 5xx. Re-enable license server; confirm recovery.
12. **Re-flip EDC back** to `CONTINIUM_EDITION=selfHosted` (or leave on `cloud` for ongoing testing — preference).

## Success criteria

- [x] License server deployed at a fixed Vercel URL.
- [ ] `/api/health` returns 200 with DB status.
- [ ] Seeded demo license retrievable by `instanceId`.
- [ ] EDC calls the license server through the implemented mode/env contract, caches the response.
- [ ] EDC at `CONTINIUM_EDITION=selfHosted` does **not** call the license server (verify in Vercel access logs).
- [ ] License-server outage → EDC continues serving (cached → fallback) without 5xx.
- [ ] No `CONTINIUM_LICENSE_ADMIN_TOKEN` value appears in any log line.

## Risk assessment

| Risk                                                   | Likelihood | Impact                 | Mitigation                                                                                             |
| ------------------------------------------------------ | ---------- | ---------------------- | ------------------------------------------------------------------------------------------------------ |
| Vercel TOS bars commercial revenue on Hobby            | Medium     | Medium (legal, future) | Acceptable while non-revenue. Move to Vercel Pro ($20/mo) or Cloudflare Workers on first paid customer |
| Admin token leaked via logs                            | Low        | Critical               | Never log the bearer header; rotate per RUNBOOK §5                                                     |
| Single license-server region → latency for far regions | Medium     | Low                    | EDC caches for 1 hr — far regions only pay latency on cache miss                                       |
| Vendored contract drift between repos                  | Medium     | High                   | PR template item: "If touching contracts/, update both repos"                                          |
| Cloud entitlement bridge regresses                     | Medium     | High                   | Covered by web licensing tests; keep `@continium/licensing` pure and bridge only in web app            |
| License DB connection string leaked into public repo   | Low        | Critical               | Lives only in private repo + Vercel secrets                                                            |

## Security considerations

- Admin endpoint must reject any request not bearing a valid `CONTINIUM_LICENSE_ADMIN_TOKEN`. Verify by attempting unauthenticated call → expect 401.
- Rate-limit `/api/licenses/check` per IP and per key/instance via Upstash/Redis (current code rate-limits IP and key hash).
- Mark license keys as one-time-print: `key` in admin-create response only; subsequent reads return `keyPrefix` only.
- Token rotation: follow `RUNBOOK.md §5` (dual-token window).

## Next steps

- Phase 6: email provider (so registration + invite + reset paths complete).
- Phase 7: full QA flow including license server in cloud and self-hosted modes.
