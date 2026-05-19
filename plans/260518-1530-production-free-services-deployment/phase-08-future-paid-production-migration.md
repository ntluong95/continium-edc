---
phase: 8
title: "Future paid production migration"
status: future
priority: P3
effort: "—"
dependencies: [7]
---

# Phase 8: Future paid production migration

## Overview

Roadmap from the free demo stack to a real production deployment when one of these triggers fires:

- Traffic regularly approaches Vercel Hobby limits or Supabase's 500 MB / 5 GB egress limits.
- The project starts collecting any identifiable patient data (PHI / clinical trial data) — **must** move BEFORE this happens.
- The project enters a commercial revenue motion (Vercel Hobby is not the right production/commercial boundary).
- Continuous-uptime SLA promised to anyone external.

**This phase is intentionally short — it points at the dedicated hardening document.**

See [`deployment/future-production-hardening.md`](../../deployment/future-production-hardening.md) for the full migration runbook.

## Context links

- All previous phase artefacts
- Free-tier limits summary in [`deployment/production-free-services-plan.md`](../../deployment/production-free-services-plan.md)

## Requirements (when this phase fires)

### Mandatory before storing PHI

- HIPAA Business Associate Agreement (BAA) signed with each data-touching vendor (database, storage, email, hosting, monitoring).
- Backups with documented retention (≥ 6 years for HIPAA-covered entities).
- Documented incident-response procedure.
- Access-logging and audit-trail retention.
- Encryption at rest verified on every stored copy.
- Risk assessment & gap analysis on the deployed stack.

### Mandatory before commercial revenue

- Upgrade Vercel Hobby → Vercel Pro ($20/mo per member) for the EDC app and/or license server, OR migrate selected services to paid container/worker infrastructure.
- Add a paid always-on worker before relying on pg-boss flows.
- Custom domain + valid commercial-grade TLS.
- Payment-provider integration (Stripe / Lemon Squeezy / Paddle).
- Customer Support inbox + SLA terms.

### Recommended (even non-PHI / non-revenue)

- Custom domain (`app.continium.com`, `license.continium.com`, `docs.continium.com`).
- Sentry (free tier 5K errors/mo or paid).
- Better Stack or Axiom for logs (free tiers exist).
- Uptime monitor (UptimeRobot free, Pingdom, BetterUptime).

## Migration path (high level)

```
Free demo                      →  Paid production
────────────────────────────────────────────────────
Vercel Hobby web app            →  Vercel Pro ($20/mo/seat) or Fly.io paid or AWS ECS
No free Background Worker       →  Render/Fly/Railway paid worker or equivalent always-on worker
Supabase Free DB               →  Supabase Pro ($25/mo) — 8 GB DB, 250 GB egress, 7-day PITR
Supabase Free DB (license)     →  Supabase Pro project (same plan)
Upstash Free Redis             →  Upstash Pay-as-you-go ($0.20/100K cmds)
Cloudflare R2 free             →  Cloudflare R2 paid ($0.015/GB-mo storage; egress remains free)
Brevo SMTP free                →  Resend ($20/mo) or Postmark ($15/mo) with verified domain
Vercel Hobby (license server)  →  Vercel Pro ($20/mo) or Cloudflare Workers paid ($5/mo)
GitHub Actions free            →  Same (sufficient for typical CI/CD)
Sentry free                    →  Sentry Team ($26/mo)
No monitoring                  →  UptimeRobot free + Better Stack free + Datadog/Honeycomb
```

**Estimated baseline paid cost: $80–120 / month** (excluding payment-provider fees).

## Domain swap

When `continium.com` (or chosen domain) is registered:

1. **Register** at a registrar with no premium markup (Cloudflare Registrar at-cost is excellent).
2. **Set DNS** at the registrar OR transfer to Cloudflare DNS (free, fast, supports proxied records).
3. **Add records**:
   - `app.continium.com   CNAME  cname.vercel-dns.com`
   - `license.continium.com  CNAME  cname.vercel-dns.com`
   - `docs.continium.com    CNAME  <docs-host>`
   - SPF / DKIM / DMARC for email (see Phase 6)
4. **In Vercel**: Domains → add `app.continium.com` and `license.continium.com` → wait for cert.
5. **If a paid worker host is used**: add any worker/private-service DNS only if it has a public endpoint.
6. **Update env vars**: `WEBAPP_URL`, `NEXTAUTH_URL`, `CONTINIUM_LICENSE_SERVER_URL`, `MAIL_FROM`, etc.
7. **Redeploy** both apps.
8. **Smoke test** at the new URLs.
9. **Keep old `*.vercel.app` URLs as fallback** for 30 days; remove after.

## Payment integration (future)

Pick **one** and stick with it:

- **Stripe** — most flexible, requires custom integration, low fees.
- **Lemon Squeezy** — Merchant-of-Record (handles tax globally), higher fees, faster integration.
- **Paddle** — Merchant-of-Record alternative; mature subscription tooling.

Wiring lives in `continium-license-server` (private repo), not in the public EDC. The EDC only knows about feature flags coming back from the license server; the license server owns the customer + subscription state.

## HIPAA / compliance hardening (do not skip)

If patient data ever touches the system:

1. **Sign BAAs** with every vendor that touches data:
   - Supabase: BAA on Team plan ($599/mo) or Pro plan with paid add-on.
   - Cloudflare R2: BAA available on Enterprise (contact sales).
   - Email provider: Brevo no BAA at any tier; Postmark BAA on Plus plan; AWS SES BAA via AWS HIPAA program.
   - Render: BAA on Organization plan + 20% surcharge.
2. **Audit log retention** ≥ 6 years (Continium already has audit log; ensure storage retention configured).
3. **Encryption at rest** verified on every storage tier (Supabase ✓, R2 ✓, Upstash ✓ — confirm in their docs).
4. **Access control review** — every role / permission audited.
5. **Penetration test** by an external firm — typically once before go-live, then annually.
6. **Incident response plan** documented + drilled.
7. **DPA / GDPR** for EU subjects in addition to HIPAA for US.

**Until all of the above is signed and verified, the system MUST NOT accept identifiable patient data.** This is the warning that lives in every other deliverable in this plan.

## Implementation steps

This phase only fires when a trigger above hits. Until then, no action.

When it fires:

1. **Read** [`deployment/future-production-hardening.md`](../../deployment/future-production-hardening.md) (full runbook).
2. **Choose** the trigger that fired — different triggers prioritize different upgrades.
3. **Build the migration plan as a fresh `plans/...-paid-production-migration/` plan**, not a continuation of this one.
4. **Communicate** to users that the URL will change (custom domain swap) at least 14 days in advance.

## Success criteria

(This phase has no immediate success criteria — it's a roadmap.)

- [ ] When triggered, a fresh paid-production-migration plan exists.
- [ ] All compliance prerequisites met before any PHI is accepted.
- [ ] Custom domain live; old `*.vercel.app` URL deprecated gracefully.

## Risk assessment

| Risk                                              | Likelihood | Impact                 | Mitigation                                                                                                 |
| ------------------------------------------------- | ---------- | ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| User stores PHI on free tier without realizing    | High       | Critical (legal)       | Strong banner in README + signup page; reject signup if a `Notice: PHI not allowed` checkbox is not ticked |
| Commercial revenue accepted while on Vercel Hobby | Medium     | Medium (TOS violation) | Upgrade trigger documented; ops calendar reminder                                                          |
| Domain transferred to a vendor with markup        | Low        | Low                    | Use Cloudflare Registrar at-cost                                                                           |
| Sentry / log retention surprise bills             | Low        | Medium                 | All paid logging services have caps; set them                                                              |

## Security considerations

- Rotate all secrets when migrating off free tiers (the free-tier passwords have been used in CI and may have been logged).
- Re-issue Continium instance IDs and license keys on the production cutover.
- Ensure DNS DNSSEC enabled at the registrar.

## Next steps

This is the terminal phase of the current plan. After this phase's triggers fire, branch a new plan.
