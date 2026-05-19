# Free-Tier Backing Services for Clinical EDC App (2026)

**Research Date:** May 18, 2026  
**Stack:** Next.js + Prisma + PostgreSQL  
**App Needs:** pgvector support, ~500MB data, always-on, transactional email, file uploads (signed URLs), rate-limiting/caching, background jobs

---

## A. PostgreSQL (Primary Database)

### Comparison Table

| Provider | Storage | Connections | pgvector | Pause/Sleep | Backup | TLS | Notes | Clinical Data TOS? |
|----------|---------|-------------|----------|------------|--------|-----|-------|-------------------|
| **Supabase** | 500MB | Unlimited | ✅ Yes (free, no extra cost) | Pauses after 1 week inactivity | 7 days | ✅ | 2 active projects max; 5GB DB egress | ⚠️ Not explicit |
| **Neon** | 0.5GB | Unlimited | ✅ Yes (native ext) | Auto-suspend after 5 min inactivity (compute-hours don't accrue) | Backups included | ✅ | 100 CU-hours/mo; 5GB egress; 10 branches; Free tier pauses aggressively | ⚠️ Not explicit |
| **Render** | 1GB | Unlimited | ❌ No mention | Expires 30d after creation + 14d grace | None | ✅ | Single node, no HA, no PITR, no exports. Dev-only. | ❌ No clinical |
| **Railway** | ~500MB | Unlimited | ❓ Unclear | No pause; $1/mo credit expires | Varies | ✅ | $5 trial credit (30d), then $1/mo; no free tier for Postgres alone | ⚠️ Not explicit |
| **Aiven** | Trial only | Limited | ❓ Unclear | Trial restricted | Trial | ✅ | No free tier for production; trial duration unclear | ❌ No free tier |
| **Xata** | Not traditional Postgres | — | ❌ No | — | — | ✅ | MySQL-compatible, different product; skip for pgvector need | N/A |

**Supabase Notes:**
- pgvector included free on all tiers; no extra charges for embeddings
- Handles 2M vectors on free tier comfortably
- Pauses after 1 week inactivity (cold start ~5s); projects wake on connection
- **DIRECT_URL workaround needed:** Prisma requires separate connection pool URL (disable PgBouncer) for some operations; Supabase provides both

**Neon Notes:**
- 100 CU-hours/mo = ~0.25 CU for 400 hrs/mo; light dev workloads OK, not production-grade
- Aggressive autoscale-to-zero (5 min idle) = high connection overhead
- Storage limit (0.5GB) is tight for 500MB+ data + growth; upgrades are paid
- Recently acquired by Databricks; pricing cut 25% on compute, 80% on storage (2025)

**Render Notes:**
- Free tier is development-only; expires after 30 days + 14-day grace = **46 days total**
- No backups, no recovery, no HA—unacceptable for any data you want to keep
- 256MB RAM insufficient for realistic EDC queries
- **Not recommended for production or even staging**

**Recommendation:** **Supabase** > Neon  
- Supabase has more practical free storage (500MB vs 0.5GB for Neon)
- pgvector included, no surprises
- Pause behavior tolerable (1 week vs 5 min)
- Migration to paid ($25/mo Pro) straightforward if you outgrow

**Risks:**
- 500MB is tight for 500MB+ data + indexes + growth → expect upgrade within 6–12 months
- Clinical/PHI data: no explicit HIPAA BAA on free tier; if handling ePHI, must upgrade to paid plan with BAA (Supabase requires handshake for compliance)
- Inactivity pause introduces latency on cold start (5–10s)

---

## B. PostgreSQL for License Server

**Recommendation:** Same provider as primary (Supabase or Neon)  
Use one project with separate schema, or separate project. License DB is tiny (<10MB), so free tier overhead is negligible.

Alternatively: **Upstash Redis** as temporary K/V store for license state (if stateless design preferred), but requires cache invalidation strategy.

---

## C. Redis / Cache Layer

### Comparison Table

| Provider | Storage | Requests/Day | Connection | TTL | Always-Free | Notes |
|----------|---------|--------------|-----------|-----|-------------|-------|
| **Upstash Redis** | 256MB | 500K cmds/mo (~16.7K/day) | REST + native TCP | ✅ | ✅ Yes, perpetual | 10 databases free; $0.5 per extra DB; rate-limiting friendly |
| **Redis Cloud** | 30MB | Unlimited | native TCP | ✅ | ✅ Trial 30MB | $0/mo after trial if under 30MB; no REST API on free tier |
| **Aiven Redis** | — | Trial only | native TCP | ✅ | ❌ Trial only | No free perpetual tier |
| **Vercel KV** | 256MB | Included with Functions | REST + native TCP | ✅ | ✅ Free if on Vercel | Tightly integrated with Next.js; 256MB = Upstash backing |

**Upstash Notes:**
- 500K commands/month = ~16.7K/day; rate-limiting at scale (1000s RPS) may hit ceiling
- REST API + native TCP both supported; great for serverless
- QStash bundled: 1K messages/day free (10 schedules)
- One free database; extras cost $0.50/mo

**Redis Cloud Notes:**
- 30MB free tier; larger than Upstash (256MB paid equivalent)
- No REST API on free tier (TCP only; less serverless-friendly)
- After trial, free tier persists if under 30MB usage

**Vercel KV Notes:**
- If hosting on Vercel: included, backed by Upstash
- Tightly integrated with Next.js; easiest DevX
- Same limits as Upstash (256MB, 500K cmds/mo)

**Recommendation:** **Upstash Redis** (if self-hosted backend) or **Vercel KV** (if full Vercel stack)  
- Upstash REST + TCP dual interface = serverless + always-on compatible
- 500K cmds/mo is modest but OK for rate-limiting + session cache
- QStash bundled = bonus for background job triggers

**Risks:**
- 500K cmds/mo ceiling: if app hits scale (10K+ daily actives), will overflow
- No persistence on free tier; data loss on instance restart acceptable for cache

---

## D. Object Storage / File Uploads

### Comparison Table

| Provider | Free Storage | Free Egress/Month | S3 API | Signed URLs | Image Transform | TOS: Medical Data | Notes |
|----------|--------------|------------------|--------|-------------|-----------------|-------------------|-------|
| **Supabase Storage** | 1GB | 5GB | ✅ (via S3) | ✅ | ❌ No | ⚠️ Not explicit | Bucket-level ACLs; simple RLS |
| **Cloudflare R2** | 10GB | ∞ (no egress fees, ever) | ✅ | ✅ | ❌ No (via separate Image Optimization) | ⚠️ Not explicit | Zero egress fees is major advantage; S3-compatible |
| **UploadThing** | 2GB | Unlimited | ❌ (proprietary) | ✅ | ✅ Built-in | ⚠️ Not explicit | Next.js native, type-safe, easiest DX; Vercel-aligned |
| **Backblaze B2** | 10GB | Free 3x monthly avg storage | ✅ | ✅ | ❌ No | ⚠️ Not explicit | $0.005/GB/mo after free; API calls free 2,500/day class B/C |
| **Storj** | 25GB | Free | ❌ (proprietary) | ✅ | ❌ No | ⚠️ Not explicit | Decentralized; privacy-forward; less ecosystem integration |

**Supabase Storage Notes:**
- 1GB free + 5GB egress bundled with Supabase DB free tier
- S3-compatible API; signed URLs straightforward (default 1hr expiry, configurable)
- Integrated auth (RLS policies) via Postgres

**Cloudflare R2 Notes:**
- 10GB free storage, 1M Class A ops, 10M Class B ops/mo
- **ZERO egress fees forever** (vs AWS S3 $0.09/GB egress) = huge cost advantage
- S3-compatible; signed URLs supported
- Works with Cloudflare Workers for image optimization

**UploadThing Notes:**
- 2GB free; built-in image optimization (compress, resize, format conversion)
- Type-safe file router; designed for Next.js
- Proprietary API (not S3), but Vercel-friendly
- No signed URL generation (files behind auth wall by default)

**Backblaze B2 Notes:**
- 10GB + free egress (3x monthly average storage)
- S3-compatible; cost-effective at scale
- Setup friction (more manual; less integrated than Supabase)

**Recommendation:** **Cloudflare R2** > Supabase Storage  
- 10GB vs 1GB = 10x more free storage
- Zero egress fees = future-proof cost structure (Supabase charges $0.06/GB egress after 5GB)
- S3 API compatibility = future migration flexibility
- If tightly integrated with Supabase: use Supabase Storage (RLS simplicity)

**Risks:**
- TOS: None of the free tiers explicitly permit clinical/PHI data. Must review BAA requirements before storing identifiable survey data.
- Cloudflare R2 free tier limited to "Standard" storage class; "Infrequent Access" class has no free allowance

---

## E. Transactional Email

### Comparison Table

| Provider | Free Volume | Daily Cap | Domain Requirement | SPF/DKIM/DMARC | Webhooks | Testing Domain | Notes |
|----------|-------------|-----------|-------------------|-----------------|----------|----------------|-------|
| **Resend** | 3,000/mo | 100/day | 1 verified domain | ✅ | ✅ | ❌ (pay per domain) | 30x increase (was 100/mo); React Email templates; upgrade $20/mo for 50K |
| **Brevo (Sendinblue)** | 300/day | 300/day | No (SMTP only) | ✅ | ✅ | ✅ Free SMTP no domain needed | Permanent free tier; best for always-free budget |
| **Mailersend** | 500/mo | 100/day | 1 domain | ✅ | ✅ | ❌ Sandbox planned | Recent downgrade: was 3K free, now 500; pay $7/mo for 5K |
| **Postmark** | Trial 100 | Trial only | 1 domain | ✅ | ✅ | ✅ Sandbox (sandbox@postmarkapp.com) | Trial-only; $100/mo minimum paid tier |
| **SendGrid** | 60-day trial; 100/day | Trial expires | 1 domain (trial) | ✅ | ✅ | ✅ sendgrid@sandbox.com | **Free tier killed (May 2025)**: now 60-day trial only, then $19.95/mo |
| **Amazon SES** | 62K/mo (1st year), then pay | Limited | Sender verification | ✅ | ✅ | ✅ sandbox env | Cheapest at scale ($0.10 per K), but minimal free tier |

**Resend Notes:**
- 3,000/mo = ~100/day = standard registration + password reset volume
- React Email templates (JSX) = good for Next.js team
- 1 verified domain required; no sandbox domain for dev
- Upgrade to $20/mo at 100/day × 30 = ~3K/mo

**Brevo Notes:**
- 300/day perpetual free = **most generous, no expiry**
- SMTP-only (no API); integrates via nodemailer / any SMTP client
- No domain verification needed (relay model)
- Contact limit: 100K free; unlimited sending if under 300/day
- Deliverability good (ISP reputation managed by Brevo)

**Mailersend Notes:**
- Free tier dropped from 3K to 500/mo (Dec 2025) → effectively broken for production
- $7/mo "Hobby" tier = 5K/mo = practical paid entry point
- If free-tier commitment critical, skip MailerSend

**SendGrid Notes:**
- **Free tier killed May 2025**; now 60-day trial (100/day) only
- After trial expires: $19.95/mo minimum
- If already on trial: counts as limited-time option

**Recommendation:** **Brevo (Sendinblue)** > Resend  
- 300/day permanent free = no surprise expiry
- Delivery reputation solid (ISP partnerships)
- SMTP integration simple (any language, framework-agnostic)
- If React Email DX critical: Resend (3K/mo, upgrade at 100/day threshold)

**Secondary (Dev/Sandbox):** SendGrid sandbox domain (sendgrid@sandbox.com) for testing without owning domain; upgrade to Brevo/Resend for prod.

**Risks:**
- Brevo SMTP-only: no webhooks for bounces / delivery tracking (add Mailgun or Postmark for bounce handling if critical)
- Resend: 1 domain requirement rules out multi-tenant sagas; domain verification can take 24–48 hrs
- All free tiers: medical/clinical data TOS not explicit; test BAA negotiation early

---

## F. Background Jobs / Cron

### Comparison Table

| Provider | Free Frequency | Timeout | Max Concurrent | Syntax | Precision | Notes |
|----------|-----------------|---------|----------------|--------|-----------|-------|
| **Vercel Cron** | Once/day | 10s (Function) | 1 per schedule | Standard crontab | ±59 min | Hobby free; Pro = once/min; precision poor on free tier |
| **GitHub Actions** | Unrestricted (~500/mo) | 6 hrs | 1 workflow run at a time | Standard crontab | ±1 min | Free for public repos; private repos get 2K mins/mo |
| **Cloudflare Cron Triggers** | 5 triggers/account, 100K reqs/day | N/A | Depends on compute | Standard crontab | ±1 min | 10ms CPU per invocation (strict); Workers free tier included |
| **Render Cron Jobs** | Free if part of free service | Varies | Depends on dyno | Standard crontab | — | Free tier expires 30d; not for production |
| **Upstash QStash** | 1K messages/day; 10 schedules | Async | Unlimited (message queue) | API-driven | Per-message | Non-blocking; scales better than Functions |

**Vercel Cron Notes:**
- Once/day only on Hobby (free)
- Cron expressions running >daily fail at deploy-time
- Precision: "1 am daily" runs 1:00–1:59 (±59 min)
- **Workaround:** external cron service (cron-job.org) + Vercel endpoint

**GitHub Actions Notes:**
- Unrestricted frequency; 2K mins/mo free for private repos (~1440 mins/mo = ~2 × daily cron)
- Best for public repos (no quota)
- Requires git webhook; not true cron (min ~1 min precision, subject to GH queueing)

**Cloudflare Cron Triggers Notes:**
- 5 free triggers; 100K requests/day across all Workers (shared quota)
- 10ms CPU time per invocation = **strict limit** (excludes heavy DB queries)
- Best for lightweight tasks (cache invalidation, webhook forwarding)
- Minimum 1-minute interval

**Upstash QStash Notes:**
- 1K messages/day = ~33 messages/hour = OK for job enqueuing
- 10 free schedules (publish-once-and-forget patterns)
- Async task queue = decouples cron from API response
- Good for email digests, report generation, pg-boss integration

**Recommendation:** **Upstash QStash** (if job workload > daily) or **Vercel Cron + external trigger** (if <daily)  
- QStash: async queue scales better; integrates with pg-boss (store job state in Postgres)
- Vercel Cron: adequate for simple daily tasks (e.g., nightly sync); free but limited
- GitHub Actions: good for public repos; 2K mins/mo = ~1 cron × 2/day for private (tight)

**Risks:**
- Vercel Cron: ±59 min precision = unacceptable for any time-critical task (e.g., medication reminders in EDC)
- QStash: 1K msgs/day ceiling; scaling to >1K/day msgs = $1 per 100K messages
- All: no persistent job history on free tier (audit trail needed for clinical apps)

---

## Summary: Recommended Free-Tier Stack

| Service | Provider | Free Limit | Upgrade Path | Cost to Outgrow |
|---------|----------|-----------|--------------|-----------------|
| **Primary PostgreSQL** | Supabase | 500MB, 5GB egress, 2 projects | Pro: $25/mo (8GB DB, 250GB egress) | 500MB → 8GB = ~3–6 mo |
| **License DB** | Supabase (same) | Shared quota | Same | — |
| **Redis Cache** | Upstash | 256MB, 500K cmds/mo | Pay-as-you-go: $0.2/100K cmds | 500K → 5M cmds = $0.80/mo |
| **File Storage** | Cloudflare R2 | 10GB, ∞ egress | Paid: $0.015/GB/mo after 10GB | 10GB → 100GB = $1.35/mo |
| **Email** | Brevo SMTP | 300/day | ∞ free (no upgrade needed) | 300/day = ~9K/mo; overkill for EDC |
| **Cron / Jobs** | Upstash QStash | 1K msgs/day, 10 schedules | Pay-as-you-go: $1/100K msgs | 1K → 100K = $0.90/mo |

**Total free-tier monthly cost: $0** (if usage stays within limits)  
**Estimated upgrade timeline: 6–12 months** (storage constraints first, then compute)

---

## Red Flags for Clinical/PHI Data

1. **No explicit HIPAA BAA on free tiers.** All free offerings assume non-regulated data. Before storing identifiable patient data:
   - Supabase: Negotiate BAA (available on Pro+ tier)
   - Cloudflare R2: Confirm clinical use in BAA; likely unavailable on free tier
   - Brevo: No mention of HIPAA; assume no BAA on free SMTP

2. **Backups & Recovery:** Supabase free = 7-day retention; Neon free = limited; Render free = none. For EDC, HIPAA requires ≥1 year retention and disaster recovery.

3. **Audit Logging:** Supabase free includes minimal audit trail; Neon free offers none. Clinical apps need detailed access logs (HIPAA §164.312(b)).

4. **Data Residency:** Most free tiers span multi-region by default. HIPAA may require fixed region (e.g., US-East for HIPAA compliance). Verify with provider.

5. **Encryption at Rest:** Upstash Redis & Cloudflare R2 free tiers do not guarantee AES-256 at rest; assume single encryption layer. Patient data requires encryption in transit (TLS) + at rest.

---

## Unresolved Questions

1. **Is EDC app handling ePHI or just de-identified research data?** (TOS restriction severity depends on this.)
2. **What's acceptable inactivity pause duration?** (Supabase 1 week vs Neon 5 min vs always-on required?)
3. **Must license DB be air-gapped from clinical DB?** (Same Supabase project, separate schema, or different provider?)
4. **Disaster recovery RTO/RPO?** (Backup frequency, region failover, affects DB choice and paid upgrade timeline.)
5. **Is 500MB + 5GB egress realistic for 3–6 months?** (Need sizing estimate: daily actives, survey size, vector embedding volume.)

---

## Migration Strategy (Free → Paid)

**Month 1–3:** Use free tier as-is. Monitor storage/compute.  
**Month 3–6:** If trending toward 70% of limits, enable paid add-ons (extra Supabase storage, Upstash higher plan).  
**Month 6+:** Full plan upgrade (Supabase Pro $25/mo, Upstash Scale tier, R2 paid storage).

All recommendations use S3-compatible APIs where possible (Supabase Storage, Cloudflare R2) to reduce future migration friction.

---

**Sources Consulted:**
- [Supabase Pricing](https://supabase.com/pricing)
- [Neon Pricing & Docs](https://neon.com/pricing)
- [Render Pricing](https://render.com/pricing)
- [Upstash Pricing](https://upstash.com/pricing)
- [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [Resend Pricing](https://resend.com/pricing)
- [Brevo Pricing](https://www.brevo.com/pricing/)
- [Vercel Cron Jobs Docs](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/platform/limits/)
