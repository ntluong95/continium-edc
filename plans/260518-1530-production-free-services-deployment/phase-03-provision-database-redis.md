---
phase: 3
title: "Provision database & Redis"
status: complete
priority: P1
effort: "0.5d"
dependencies: [2]
---

# Phase 3: Provision database & Redis

## Current status — 2026-05-19

- Supabase EDC project provisioned; `DATABASE_URL` and `DIRECT_URL` added to Vercel EDC project.
- Supabase license DB provisioned; `LICENSE_DATABASE_URL` added to Vercel license-server project.
- Migrations have not yet run against hosted DBs — will run automatically on next push to `main` via GitHub Actions workflow.

## Overview

Stand up the free PostgreSQL (with pgvector) and free Redis instances. Capture connection strings, verify network reachability, run an empty migration to confirm Prisma can connect. Do this **before** Phase 4 (app deploy) so the app's first boot has a working DB.

## Context links

- App's Prisma schema: `packages/database/prisma/schema.prisma`
- License-server Prisma schema: `apps/license-server/prisma/schema.prisma` (will move to private repo in Phase 5)
- pgvector usage: `packages/database/prisma/schema.prisma` (look for `vector` columns)
- Research: [`research/free-backing-services.md`](./research/free-backing-services.md) §A & §C

## Requirements

### Functional

- 2× Postgres databases (one for EDC, one for license server) — **separate** instances or separate Supabase projects.
- 1× Redis instance shared between EDC and license server (acceptable for free; both use different key prefixes).
- pgvector extension enabled on the EDC database. (Not required on license-server DB.)
- Prisma can `migrate deploy` to both databases without manual intervention.
- Region: pick **us-east-1** or **eu-central-1** to match the chosen app host's region.

### Non-functional

- Connection strings stored in deployment platform's secrets (never committed).
- Both DBs use TLS (default for Supabase, Neon, Render).
- Supabase project name does not include "prod" / "prod-clinical" — pick something neutral (e.g. `continium-edc-staging`) since this is NOT production-grade.

## Architecture

### Primary EDC database (recommended: Supabase free)

```
Service     : Supabase Free
Plan        : Free (500 MB storage, 5 GB egress/mo, pgvector included)
Region      : us-east-1 (or eu-central-1)
Project name: continium-edc-staging
Pooler URL  : postgres://<user>:<pwd>@<host>:6543/postgres?pgbouncer=true&connection_limit=1
Direct URL  : postgres://<user>:<pwd>@<host>:5432/postgres
```

**Prisma config**:

```
DATABASE_URL       = <pooler URL>     # used by app at runtime
DIRECT_URL         = <direct URL>     # used by Prisma Migrate
JOBS_DATABASE_URL  = <direct URL>     # pg-boss needs LISTEN/NOTIFY which the pooler doesn't pass
```

`packages/database/prisma/schema.prisma` already has `datasource db { url = env("DATABASE_URL"); directUrl = env("DIRECT_URL") }` — verify in Phase 2.

### License-server database (recommended: separate Supabase project on same account)

```
Service     : Supabase Free (second project — Supabase free allows 2 projects per org)
Plan        : Free
Region      : same as EDC (latency from license-server compute)
Project name: continium-license-staging
URL         : postgres://<user>:<pwd>@<host>:5432/postgres
```

License DB is tiny (< 10 MB); pooler not needed.

### Redis (recommended: Upstash free)

```
Service     : Upstash Redis
Plan        : Free (256 MB, 500K cmds/mo, REST + TCP)
Region      : Global (multi-region read replicas, low write region)
Connection  : rediss://default:<pwd>@<host>:6379  (TCP, TLS)
REST URL    : https://<host>.upstash.io
REST TOKEN  : <token>
```

Both apps read `REDIS_URL`. License server also reads `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` if rate-limiter uses REST mode (lower latency from Vercel serverless).

**Note on quota**: 500K commands/month ≈ 16.7K/day. For a public-but-quiet early demo, fine. If you set a Next.js ISR strategy that pings Redis on every page render, you'll burn this in days — keep Redis usage to:

- Session storage (next-auth) — only on login/logout.
- Rate limiting on auth endpoints.
- License check cache (TTL 3600 s).

Do **not** use Redis as the main Next.js page cache on the free tier.

### Alternatives considered

- **Neon free** — aggressive 5-min idle pause; expensive on cold-start latency for an interactive EDC. **Reject** as primary.
- **Render free Postgres** — expires after 30 days. **Reject** for anything but a 1-week demo.
- **Cloudflare D1** — SQLite, no pgvector. **Reject.**
- **Railway** — no free tier (trial only). **Reject.**

## Related code files

No code edits in this phase. Reads only:

- `packages/database/prisma/schema.prisma` — confirm `directUrl` line + pgvector
- `apps/web/lib/env.ts` (or `apps/web/env.mjs`) — confirm `DATABASE_URL`, `DIRECT_URL`, `JOBS_DATABASE_URL`, `REDIS_URL` declared

## Implementation steps

1. **Sign up** for Supabase (`supabase.com`) — choose the team's main email.
2. **Create project** `continium-edc-staging` in the chosen region. Save the connection strings from "Project Settings → Database":
   - URI (transaction-pooler) → goes in `DATABASE_URL`
   - URI (direct) → goes in `DIRECT_URL` and `JOBS_DATABASE_URL`
3. **Enable pgvector**: Supabase Dashboard → Database → Extensions → search `vector` → enable.
4. **Smoke-test Postgres connection** locally:
   ```bash
   psql "$DIRECT_URL" -c "select 1;"
   psql "$DIRECT_URL" -c "select extname from pg_extension where extname = 'vector';"
   ```
5. **Create second project** `continium-license-staging` (same region). Save its direct URL → `LICENSE_DATABASE_URL`.
6. **Sign up** for Upstash (`upstash.com`).
7. **Create Redis database** `continium-cache` in matching region. Save:
   - `UPSTASH_REDIS_URL` (TCP, rediss://...) → goes in `REDIS_URL`
   - REST URL + token → save for license-server config
8. **Verify Redis** locally:
   ```bash
   redis-cli -u "$REDIS_URL" PING
   ```
9. **Apply EDC migrations** locally to confirm schema applies cleanly:
   ```bash
   export DATABASE_URL='<pooler URL>'
   export DIRECT_URL='<direct URL>'
   pnpm --filter @continium/database migrate:deploy
   ```
10. **Apply license-server migrations** locally:
    ```bash
    export LICENSE_DATABASE_URL='<license direct URL>'
    cd apps/license-server  # or in the staged private repo
    pnpm db:migrate:deploy
    ```
11. **Record** connection strings in the deployment platform's secrets manager (Vercel env for the selected demo stack). **Do not commit.**

## Success criteria

- [ ] Supabase EDC project reachable; pgvector enabled.
- [ ] Supabase license-server project reachable.
- [ ] Upstash Redis reachable via TCP and REST.
- [ ] `prisma migrate deploy` succeeds against both DBs.
- [ ] `psql ... -c "\dt"` shows expected tables.
- [ ] Connection strings stored only in the deployment platform's secret manager + local `.env.local` (gitignored).

## Risk assessment

| Risk                                                                  | Likelihood | Impact                                      | Mitigation                                                 |
| --------------------------------------------------------------------- | ---------- | ------------------------------------------- | ---------------------------------------------------------- |
| Supabase pauses after 1 week inactivity                               | High       | Low (first user wakes it; 5–10s cold start) | Document in user-facing demo banner                        |
| 500 MB storage filled by clinical responses + attachments             | Medium     | High                                        | Phase 8 monitors; move attachments to R2 (not in DB) early |
| Pooler URL passed to `JOBS_DATABASE_URL` breaks pg-boss LISTEN/NOTIFY | High       | High (jobs silently fail)                   | Always use direct URL for jobs DB                          |
| Upstash 500K cmds/mo burned by ill-tuned cache                        | Medium     | Medium                                      | Add request-counter alert; rate-limit reads                |
| Region mismatch between DB + app → 100+ ms per query                  | Medium     | Medium                                      | Pick region once, stick to it across all services          |

## Security considerations

- Both Supabase projects: rotate the **service-role** key as soon as the Dashboard is created if you didn't use it. The app uses the standard pooler URL, not the service-role.
- Enable Supabase IP allow-list if the chosen app host has a static IP (Render does not on free tier — skip).
- Upstash: enable TLS-only (default).
- Redis password is part of the URL — treat as a secret.

## Next steps

- Phase 4: deploy the EDC app pointing at these DBs.
- Phase 5: deploy the license server pointing at its DB.
