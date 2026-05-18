# Future Production Hardening Runbook

> When the free-tier stack outgrows its purpose, follow this runbook to migrate to paid, production-grade infrastructure. **Do not skip the compliance section if PHI / patient data is ever a possibility.**

---

## 1. When to migrate (triggers)

Migrate **before** any of these happens, not after:

| Trigger                                                                             | Why migrate now                                            |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Real patient data is about to be accepted                                           | Free-tier TOS prohibits PHI; HIPAA BAAs unavailable        |
| Commercial revenue begins                                                           | Vercel Hobby TOS prohibits revenue-generating apps         |
| Traffic regularly approaches Vercel Hobby limits or sustained commercial use begins | Hobby tier is not the right production/commercial boundary |
| Supabase storage > 400 MB                                                           | 80% of free-tier headroom                                  |
| Supabase egress > 1.5 GB/mo                                                         | 75% of free-tier headroom                                  |
| Upstash > 400K cmds/mo                                                              | 80% of free-tier headroom                                  |
| Continuous uptime SLA promised                                                      | Free tier has no uptime guarantee                          |
| Customer support contracts signed                                                   | Implies obligation to maintain availability                |

---

## 2. Compliance hardening (before any PHI)

⚠️ **Do not store identifiable patient data on free-tier infrastructure.** The current stack does not meet HIPAA / GDPR / 21 CFR Part 11 requirements.

Before storing any PHI:

1. **Sign Business Associate Agreements (BAAs)** with every vendor that touches data:

   | Vendor        | BAA availability | Plan required                                               |
   | ------------- | ---------------- | ----------------------------------------------------------- |
   | Supabase      | ✓                | Team ($599/mo) or Pro + paid add-on                         |
   | Render        | ✓                | Organization plan + 20% surcharge                           |
   | Cloudflare R2 | Limited          | Contact Cloudflare Enterprise sales                         |
   | Vercel        | ✓                | Enterprise (custom pricing)                                 |
   | Brevo         | ✗                | Migrate to Postmark Plus or AWS SES (via AWS HIPAA program) |
   | Upstash       | ✗                | Use ElastiCache or Redis Enterprise                         |
   | Sentry        | ✓                | Business plan                                               |
   | GitHub        | ✓                | Enterprise                                                  |

2. **Backup retention:** ≥ 6 years for HIPAA-covered entities. Configure:
   - Supabase PITR (Point-in-Time Recovery) — 7-day retention on Pro, 14-day on Team.
   - Add nightly logical backups via `pg_dump` to a separate region/provider.
   - Test restore quarterly.

3. **Audit logging:**
   - Continium clinical audit log already in place; verify storage retention.
   - Application access logs → Better Stack / Datadog with 6-year retention.
   - Database audit logs → enable in Supabase / managed Postgres.

4. **Encryption verification:**
   - At rest: confirmed on Supabase, R2, Upstash paid tiers.
   - In transit: TLS 1.2+ enforced on every endpoint.
   - Field-level encryption for clinically sensitive columns (already present in `apps/web/lib/crypto/`).

5. **Access control review:**
   - All role / permission gates audited.
   - 2FA mandatory for all admin / org-owner accounts.
   - Session timeout aligned with HIPAA recommendations (≤ 15 min idle for sensitive workflows).

6. **Pen test:** External firm before go-live + annually thereafter.

7. **Incident response plan:** Documented + drilled. Defines RTO / RPO, escalation, breach notification.

8. **DPA / GDPR:** For EU data subjects. Sub-processor list public.

9. **21 CFR Part 11 (if running US FDA-regulated trials):** Tamper-evident audit trail (already present), e-signatures, validated system.

**Until 1–9 are signed off, the system is non-compliant for real clinical data.**

---

## 3. Service-by-service upgrade matrix

### 3.1 Continium EDC web

| Free → Paid                                     | Steps                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Vercel Hobby** → **Vercel Pro** ($20/mo/seat) | Dashboard → Plan → upgrade. Allows commercial use; no code change.                    |
| **Vercel Hobby** → **Fly.io paid**              | Build `fly.toml`; `fly deploy`; update DNS. Adds always-on/container behavior.        |
| **Vercel Hobby** → **AWS ECS / Fargate**        | Containerize, push to ECR, define task / service, set up ALB + TLS. Significant work. |

Recommended path: Vercel Pro for the web app first; add a paid worker separately; graduate to container/Kubernetes only when workload requires it.

### 3.2 EDC background worker

There is no always-on worker in the selected Vercel Hobby demo stack. Add a paid Render/Fly/Railway worker or equivalent always-on process before relying on pg-boss in production-like demos.

### 3.3 PostgreSQL

| Free → Paid                                                    | Steps                                                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Supabase Free** → **Supabase Pro** ($25/mo)                  | Dashboard → Settings → Subscription → upgrade. 8 GB storage, 250 GB egress, 7-day PITR, daily backups. |
| **Supabase Free** → **Supabase Team** ($599/mo, BAA available) | For HIPAA-covered deployments.                                                                         |
| **Supabase Free** → **Self-managed RDS / Cloud SQL**           | Export via `pg_dump`; provision; restore; update `DATABASE_URL` / `DIRECT_URL`. Test extensively.      |

### 3.4 Redis

| Free → Paid                                         | Steps                                               |
| --------------------------------------------------- | --------------------------------------------------- |
| **Upstash Free** → **Upstash Pay-as-you-go**        | $0.20/100K cmds. No code change; just deeper quota. |
| **Upstash** → **AWS ElastiCache / GCP Memorystore** | Required for HIPAA BAA. Update `REDIS_URL`.         |

### 3.5 Object storage

| Free → Paid                 | Steps                                                                          |
| --------------------------- | ------------------------------------------------------------------------------ |
| **R2 free** → **R2 paid**   | $0.015/GB-mo storage; egress remains $0. No migration needed.                  |
| **R2** → **AWS S3** (HIPAA) | Bucket-to-bucket copy with `aws s3 sync`; update env vars; verify signed URLs. |

### 3.6 Email

| Free → Paid                                           | Steps                                                                       |
| ----------------------------------------------------- | --------------------------------------------------------------------------- |
| **Brevo free SMTP** → **Resend** ($20/mo)             | Verify domain (SPF + DKIM + DMARC). Swap SMTP\_\* env vars.                 |
| **Brevo** → **Postmark** ($15/mo, BAA on Plus)        | Same swap; better deliverability + bounce webhooks.                         |
| **Brevo** → **AWS SES** (HIPAA via AWS HIPAA program) | Verify domain; request production access (out of sandbox); update SMTP\_\*. |

### 3.7 License server

| Free → Paid                                      | Steps                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| **Vercel Hobby** → **Vercel Pro** ($20/mo/seat)  | Dashboard → Plan → upgrade. Allows commercial revenue.                          |
| **Vercel** → **Cloudflare Workers Paid** ($5/mo) | Requires port to Hono + Prisma Accelerate or D1. Significant work; lowest cost. |
| **Vercel** → **Render Standard / AWS**           | Full container deploy; same Next.js code base.                                  |

---

## 4. Custom domain swap

1. **Acquire domain.** Cloudflare Registrar = at-cost. If `continium.com` is unavailable, candidates: `continium.app`, `continium.io`, `continium.health`.
2. **DNS provider:** Cloudflare DNS (free, proxied). Or registrar's native DNS.
3. **Records:**

   ```
   app.continium.com        CNAME  cname.vercel-dns.com
   license.continium.com    CNAME  cname.vercel-dns.com
   docs.continium.com       CNAME  <docs-host>          # Mintlify, Vercel, etc.
   marketing.continium.com  CNAME  <marketing-host>
   @                        ALIAS  <root-host>          # if hosting marketing on root
   www                      CNAME  @
   ```

4. **Email:** SPF / DKIM / DMARC per Phase 6 §"Future SPF / DKIM / DMARC".
5. **TLS:** Vercel auto-provisions Let's Encrypt certs once DNS resolves.
6. **Update env vars:**
   - EDC: `WEBAPP_URL`, `NEXTAUTH_URL`, `PUBLIC_URL`, `MAIL_FROM`, `CONTINIUM_LICENSE_SERVER_URL`.
   - License server: `LICENSE_SERVER_PUBLIC_URL`.
7. **Redeploy** both services.
8. **Smoke test** at new URLs.
9. **Keep old `*.vercel.app` URLs as fallback** for 30 days. Redirect after that.

---

## 5. Payment integration

Wire only in the **private license-server repo**. The public EDC reads features, never customers.

### 5.1 Decision tree

```
Need international tax / VAT handled for you? ──┬── YES ──→ Lemon Squeezy or Paddle
                                                 │
                                                 └── NO  ──→ Stripe
```

### 5.2 Stripe wiring

1. Create products + prices in Stripe Dashboard.
2. Add webhook endpoint in license-server: `POST /api/v1/webhooks/stripe`.
3. Add env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
4. License-server schema additions: `Customer`, `Subscription`, `Invoice`.
5. On `invoice.payment_succeeded` → ensure license active.
6. On `customer.subscription.deleted` → revoke license.
7. Issue / re-issue license keys per customer; map to feature set.

### 5.3 Lemon Squeezy / Paddle

Same endpoints, different webhook signatures. Both handle tax compliance globally — fewer engineering hours, higher fees.

---

## 6. Monitoring / observability

Free tier of each, in priority order:

1. **Sentry Developer (free)** — 5K errors/mo. Wire `SENTRY_DSN` in both apps.
2. **Better Stack (free)** — log streaming. Add Render / Vercel log drain.
3. **UptimeRobot (free)** — 50 monitors, 5-min interval. Ping `/api/health` on both apps.
4. **Axiom (free)** — 500 GB/mo logs + traces. OpenTelemetry endpoint goes in `OTEL_EXPORTER_OTLP_ENDPOINT`.

Paid upgrades when limits hit:

- Sentry Team ($26/mo) — 50K errors.
- Better Stack paid tiers.
- Datadog / New Relic for full APM if revenue justifies $99+/mo.

---

## 7. Cost projection at scale

| Stage                   | Users / mo | Stack                                                                                                          | Monthly cost |
| ----------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- | ------------ |
| Demo / pre-launch       | < 100      | Free stack                                                                                                     | $0           |
| Beta / paid prep        | 100–500    | Vercel Pro + paid worker + Supabase Pro + Upstash Pay-as-you-go + R2 paid + Resend + Sentry Dev                | $80–120      |
| GA / first 1K customers | 1K–5K      | + Render Standard + Supabase Team (HIPAA) + ElastiCache + S3 + Postmark Plus + Vercel Enterprise + Sentry Team | $1,000–2,500 |
| Enterprise / regulated  | 5K+        | Custom — AWS / GCP managed; dedicated SRE                                                                      | $5K–15K+     |

---

## 8. Rate limits & feature flags for production

- Tighten `apps/web/lib/rate-limit.ts` thresholds (free-tier defaults intentionally lenient).
- Wire LaunchDarkly / GrowthBook / Unleash for production feature flags. Continium's licensing layer is sufficient for clinical features; product feature flags are separate.
- Burn-rate alerts on Sentry / Better Stack.

---

## 9. Secret rotation cadence

- License-server `CONTINIUM_LICENSE_ADMIN_TOKEN`: rotate every 90 days (dual-token window per RUNBOOK §5).
- `NEXTAUTH_SECRET`: rotate annually (forces all sessions to expire).
- `ENCRYPTION_KEY`: rotate annually with key-versioning support (do NOT swap a single static key — re-encrypt rolling).
- OAuth client secrets: rotate annually + on personnel change.
- Database passwords: rotate quarterly via Supabase / managed DB.

Tools: 1Password / Vault / AWS Secrets Manager. Free tiers exist for all three.

---

## 10. Migration cutover plan template

1. **T-30 days:** Communicate to users that the URL will change.
2. **T-14 days:** Spin up paid stack in parallel; clone DB; smoke-test.
3. **T-7 days:** DNS TTL lowered to 300 s.
4. **T-0 (cutover window):**
   - Put a banner on free stack: "Migrating — read-only for 30 min."
   - Final `pg_dump` from free DB → `pg_restore` into paid DB.
   - Update DNS to point at paid stack.
   - Update env vars; redeploy.
   - Smoke test.
   - Remove banner.
5. **T+7 days:** Free stack archived (DB snapshotted, services stopped).
6. **T+30 days:** Free stack deleted.

Always plan a **dry-run** of the cutover at least once before the real one.

---

## 11. Open follow-ups

- Acquire `continium.com` or accept alternative.
- Decide Sentry / Better Stack / Axiom long-term.
- Decide on payment provider (Stripe vs Lemon Squeezy vs Paddle).
- Decide on managed Postgres long-term (Supabase Pro vs RDS).
- HIPAA gap analysis if PHI is ever planned.
