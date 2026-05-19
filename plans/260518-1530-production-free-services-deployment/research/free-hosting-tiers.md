# Q4 2026 Free-Tier Hosting Comparison: Next.js + PostgreSQL + Redis

## Executive Summary

**Target:** Continium EDC (full Next.js 16 app) + License Server (lightweight API).

No single platform offers **both** free unlimited compute + free PostgreSQL + free Redis + no cold starts. All "truly free" tiers have harsh trade-offs. **Vercel + Supabase + Cloudflare Workers combo** balances cost, complexity, and production readiness best.

---

## Detailed Comparison

| Platform | Always-Free | Cold Start | RAM/CPU | Build Minutes | Bandwidth/Month | Custom Domain | Background Jobs | WebSocket | Regions | Next.js 16 | Prisma |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Vercel** | Yes (Hobby tier) | No (always-on, edge) | 4h CPU/mo | Unlimited | 100 GB | Yes, free HTTPS | ❌ No | ❌ Serverless | NA/EU/APAC | ✓ Native | ✓ Works |
| **Render** | Yes (Hobby) | 30–60s on wake | 512 MB / 0.1 CPU | Unlimited | Unlimited | Yes, free HTTPS | ⚠️ Cron only | ✓ Yes | NA/EU | ✓ Tested | ✓ Works |
| **Railway** | Trial only ($5, 30d) | No (always-on) | Varies | Unlimited | Unlimited | Yes, free | ✓ Cron/webhooks | ✓ Yes | NA/EU/APAC | ✓ Tested | ✓ Works |
| **Fly.io** | ❌ Removed (2024) | No | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| **Koyeb** | ❌ Web tier removed | N/A | Free: 1GB/0.25 CPU (db only) | Unlimited | Unlimited | Yes | ❌ No | ❌ No | EU/NA | Untested | Untested |
| **Cloudflare Workers** | Yes (100k req/day) | <50ms | 128 MB | Unlimited | Unlimited | Yes (Workers) | ✓ Durable Objects/KV | ✓ Yes | 200+ edge | ✗ API only | N/A |
| **Supabase Edge Fn** | Yes (500k inv/mo) | <100ms | Serverless | Unlimited | Unlimited | Yes | ✓ Webhooks/pg_cron | ❌ No | NA/EU/APAC | ✗ API only | ✓ PostgreSQL |
| **Northflank** | Yes (Sandbox: 2 svc + 2 db) | No | Always-on | Unlimited | Unlimited | Yes, free | ✓ Cron | ✓ Yes | EU/NA | ✓ Container | ✓ Works |

---

## Platform Deep-Dives

### Vercel
- **Free tier:** Hobby (always-free, no trial).
- **Hard limits:** 100 GB bandwidth/month (stops deployment/function runs on breach; no overage option).
- **Cold start:** Zero (runs on edge, global cache).
- **PostgreSQL:** Not included; use external (Neon, Supabase, Prisma Postgres).
- **Redis:** Not included.
- **Background jobs:** ❌ No native support (use external: pg_boss, Bull, etc. on external DB).
- **Production risk:** Fair Use Policy blocks commercial use (paid Pro $20/mo required for revenue-generating apps).
- **Prisma:** Full support; `prisma migrate deploy` in build hook works out of box.
- **Next.js 16:** ✓ Fully native, tested extensively.
- **Verdict:** Best for static sites + lightweight serverless. EDC too complex (needs bg jobs, db, cache).

### Render
- **Free tier:** Hobby (always-free).
- **PostgreSQL:** Free 256 MB, expires 30 days after creation; 14-day grace period, then deleted.
- **Redis:** Free 25 MB (useful for small projects only).
- **Cold start:** 30–60 seconds on wake (spins down after 15 min inactivity).
- **Build cache:** Supported; good for monorepos.
- **Background jobs:** Cron only (no pg_boss equivalent out of box).
- **Prisma:** Works; `prisma migrate deploy` supported.
- **Production risk:** Free DB expires; move to paid ($7/svc) to avoid spindown.
- **Verdict:** Cheapest full-stack free option for prototypes. Not suitable for production (cold starts, DB expiry).

### Railway
- **Free tier:** Trial ($5 one-time credit, 30-day expiry). No permanent free tier.
- **After trial:** Hobby plan $5/month (includes $5 credit → net free if under quota).
- **PostgreSQL:** Included, managed.
- **Redis:** Available as add-on service.
- **Prisma:** Full support; auto-detects Next.js framework.
- **Background jobs:** Cron + webhooks.
- **Production risk:** Trial expires → must move to paid. Reasonable at $5/mo.
- **Verdict:** Best "paid-lite" option after trial ($5/mo covers small workload). Good for License Server.

### Fly.io
- **Status:** Removed free tier for new users (2024). Legacy customers retain old allowances (3x 256MB shared-CPU VMs).
- **New signups:** $5 trial credit, then pay-as-you-go ($0.15/vCPU-hr, $0.04/GB-hr).
- **PostgreSQL:** Starts at $38/mo (Basic plan).
- **Verdict:** ❌ Not viable for free-tier new projects.

### Koyeb
- **Status (Q1 2026):** Free web service tier removed. Acquired by Mistral AI (Feb 2026).
- **Remaining free:** PostgreSQL database (1 GB, 0.25 CPU, 50 active hours/month; sleeps after 5 min inactivity).
- **Compute:** Must use paid Starter plan ($29/mo) for containers.
- **Verdict:** ❌ Not viable; free DB only, no free compute.

### Cloudflare Workers (+ Hono)
- **Free tier:** 100,000 requests/day, 10 million/month, 1MB bundle limit.
- **Execution:** <50 ms cold start; CPU timeout 10 ms (free), 30 s (paid).
- **Use case:** Lightweight REST API only (License Server ideal).
- **Storage:** D1 (SQLite, 3 GB free), R2 (object storage, free tier), KV (key-value, free tier).
- **Limitation:** Cannot run full Next.js (too large, 10MB bundle soft cap); Hono required instead.
- **Prisma:** Not compatible (needs PostgreSQL + Node.js runtime).
- **Verdict:** Excellent for License Server API (Hono + Workers). **Cannot** host EDC.

### Supabase Edge Functions
- **Free tier:** 500,000 function invocations/month.
- **PostgreSQL:** Free 500 MB storage (included).
- **Cold start:** ~100 ms (edge function, cached).
- **Limitation:** Suspended after 1 week inactivity (free tier only).
- **Use case:** Lightweight API + PostgreSQL backend (License Server).
- **Prisma:** Yes, Supabase-hosted PostgreSQL works; edge functions run at edge.
- **Production risk:** Inactivity suspension (dev only, not production-grade).
- **Verdict:** Good for prototyping. Production requires paid plan ($25/mo).

### Northflank
- **Free tier:** Sandbox (2 free services, 2 free databases, always-on, no spindown).
- **Limitation:** Sandbox labeled "hobby/test only", TOS says not for production.
- **Supports:** Docker, any language, Prisma, Next.js.
- **Production:** Starting at $20/mo.
- **Verdict:** Sandbox fine for testing; production must upgrade.

---

## Critical Findings

### PHI / HIPAA / Clinical Data
- **All free tiers explicitly prohibit PHI / protected health information / clinical trial data.**
- Render: HIPAA compliance requires $250/mo Organization plan + 20% usage fee.
- Railway: HIPAA BAA available on Enterprise (custom pricing).
- Vercel: No HIPAA support documented.
- Fly.io: HIPAA add-on $99/mo (but no free tier anyway).

**Impact on Continium:** If handling patient data, free tier is non-starter. Verify Continium's use case (EDC often = clinical data = HIPAA required).

### Prisma Migration Support
| Platform | Supports `prisma migrate deploy` | Notes |
|---|---|---|
| Vercel | ✓ | Native Next.js integration; runs in build hook. |
| Render | ✓ | Cron job or release phase. |
| Railway | ✓ | Runs in build step automatically. |
| Cloudflare Workers | ❌ | No Node.js, incompatible. |
| Supabase Edge Fn | ⚠️ | Edge functions cannot run migrations; use pg_cron in PostgreSQL. |
| Northflank | ✓ | Container release phase or cron. |

### Docker & Binary Dependencies
- **Cloudflare Workers, Vercel:** ❌ No Docker (serverless only).
- **Render, Railway, Northflank, Fly.io:** ✓ Docker support (Northflank, Render strongest).
- **Impact on Continium:** If HEIC-convert or other binary deps needed, use Render/Railway/Northflank.

### Turborepo & Build Cache
- **Vercel, Render, Railway, Northflank:** ✓ Monorepo support, build cache.
- **Fly.io:** ✓ Docker Caching.
- **Cloudflare Workers, Supabase:** ❌ Not applicable (serverless/small bundles).

### PostgreSQL + Redis in Tandem (Free Tier)
| Platform | Free DB | Free Cache | Notes |
|---|---|---|---|
| Render | ✓ (256 MB, expires 30d) | ✓ (25 MB) | Smallest; cache useless for real workload. |
| Railway | ✓ (trial $5) | Add-on paid | Must pay for Redis. |
| Supabase | ✓ (500 MB) | ❌ No Redis | Use Redis external. |
| Vercel | ❌ | ❌ | Use external (Upstash, Redis Cloud). |
| Cloudflare | D1 (SQLite) | KV ✓ | No PostgreSQL. |

---

## Feasibility Assessment

### Continium EDC (Complex App)
**Requirements:** PostgreSQL, Redis, OpenTelemetry, background jobs (pg_boss), OAuth, S3 storage, SMTP, 50+ pages, migrations.

| Approach | Cost | Cold Start | Risk | Verdict |
|---|---|---|---|---|
| **Render (free tier only)** | $0 | 30–60s | DB expires 30d; cold starts unacceptable for production | ❌ Prototype only |
| **Vercel + Supabase + upstash Redis** | Free + $25/mo (Supabase Pro) + $10/mo (Upstash) = ~$35/mo | <100ms | Good; no vendor lock; prod-ready | ✓ Viable |
| **Railway ($5/mo after trial)** | $5/mo minimum | <100ms | Reliable; all-in-one; simple | ✓ Best lightweight |
| **Northflank (Sandbox, free)** | $0 initially | <100ms | Free tier unsupported for prod; must upgrade ($20/mo) | ⚠️ Temp only |

### License Server (Lightweight API)
**Requirements:** PostgreSQL, Redis rate-limiting, OAuth, very low traffic.

| Approach | Cost | Cold Start | Verdict |
|---|---|---|---|
| **Cloudflare Workers + Hono + D1** | Free | <50ms | ✓ Excellent; D1 (SQLite) sufficient; use Workers KV for rate-limit cache |
| **Supabase Edge Fn + PostgreSQL** | Free | ~100ms | ✓ Good; use pg_cron for scheduled tasks; PostgreSQL native |
| **Railway trial ($5)** | Free (trial) → $5/mo | <100ms | ✓ Overkill but bulletproof |
| **Vercel + external PostgreSQL** | Free + $25/mo (Supabase) | <100ms | ✓ Viable; edge functions for lightweight API |

---

## Recommendations

### **Recommended Primary Stack**
**For Continium EDC:**
1. **Vercel** (Hobby tier, always-free) — host Next.js frontend/middleware.
2. **Railway Hobby** ($5/mo after trial) — host separate Express/Node.js backend API, PostgreSQL, Redis.
3. **Reason:** Separate compute from data; Vercel's edge functions + serverless; Railway's managed PostgreSQL + Redis eliminates infrastructure burden. Total cost ~$5/mo, production-ready.

**For License Server:**
1. **Cloudflare Workers + Hono** (free tier) — API server.
2. **Supabase PostgreSQL** (free tier, 500 MB) — lightweight user DB.
3. **Cloudflare KV** (free tier) — rate-limit cache.
4. **Reason:** Sub-50ms latency, zero cold starts, extremely low cost, battle-tested framework pairing.

### **Recommended Fallback Stack**
**All-in-one simplicity (if team prefers single vendor):**
1. **Railway Hobby** ($5/mo) — both EDC app + License Server + PostgreSQL + Redis.
2. **Reason:** No cold starts, migrations out of box, simple day-2 ops. Only cost is $5/mo after trial burn.

---

## Unresolved Questions

1. **Continium EDC handles patient data?** If yes → HIPAA mandatory → free tier non-starter. Verify TOS compliance.
2. **S3-compatible storage scope?** If large (>1GB/mo), Vercel's 1GB Blob insufficient. Budget external (R2 ~$0.15/GB).
3. **pg_boss background job load?** If >100 jobs/day, Railway may need upgrade. Verify queue depth requirements.
4. **OpenTelemetry backend?** Vercel/Railway don't include traces free; use external (Axiom free 500 GB/month, or Datadog APM free tier).

---

## Sources

- [Vercel Pricing](https://vercel.com/pricing)
- [Render Free Tier 2026](https://render.com/articles/platforms-with-a-real-free-tier-for-developers-in-2026)
- [Railway Pricing](https://railway.com/pricing)
- [Fly.io Pricing](https://fly.io/pricing/)
- [Koyeb Pricing](https://koyeb.com/blog/top-postgresql-database-free-tiers-in-2026)
- [Cloudflare Workers Hono](https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/hono/)
- [Supabase Edge Functions Pricing](https://supabase.com/pricing)
- [Northflank Pricing](https://northflank.com/pricing)
- [Render HIPAA Compliance](https://render.com/docs/hipaa-compliance)
- [Prisma Production Guide](https://www.prisma.io/docs/orm/prisma-client/deployment)
