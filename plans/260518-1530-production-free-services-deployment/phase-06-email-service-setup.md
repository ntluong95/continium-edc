---
phase: 6
title: "Email service setup"
status: in-progress
priority: P2
effort: "0.5d"
dependencies: [4]
---

# Phase 6: Email service setup

## Overview

Wire transactional email so the public app can send registration verification, password reset, and organization-invite emails. Recommended provider remains **Brevo** for free quota. The user-confirmed app host is **Vercel Hobby**, so the current SMTP/nodemailer path can be used without adding an HTTPS email adapter.

## Context links

- Existing email integration: `packages/email/` + `nodemailer` in `apps/web` deps
- Env vars from Phase 4: `SMTP_*`, `MAIL_FROM`, `MAIL_FROM_NAME`
- Research: [`research/free-backing-services.md`](./research/free-backing-services.md) §E
- Auth flow files: `apps/web/modules/auth/` (verification, password reset)
- Invite flow: `apps/web/modules/organization/...`

## Requirements

### Functional

- Registration-verification email arrives within 60 s of signup (on free tier).
- Password-reset email arrives within 60 s of request.
- Organization-invite email arrives within 60 s of invite action.
- Sender address is recognizable; reply-to set to a monitored mailbox.
- Email links use the production `WEBAPP_URL` (HTTPS), never `localhost`.

### Non-functional

- TLS for SMTP (port 587 STARTTLS).
- No PHI / patient names in the email subject or body. Use organization/project labels only.
- Email throughput within free-tier daily caps (Brevo 300/day; Resend 100/day).

## Architecture

### Primary: Brevo SMTP on Vercel Hobby (free, no domain required)

```
Provider : Brevo (formerly Sendinblue)
Plan     : Free SMTP relay
Sending  : 300 emails / day, no monthly cap
Identity : Any sender address — but DMARC reputation suffers without DKIM/SPF on your own domain
SMTP host: smtp-relay.brevo.com
SMTP port: 587 (STARTTLS)
Auth     : username = brevo-issued login, password = brevo-issued master key
```

**Env config**:

```
MAIL_FROM=noreply@brevomail.continium-demo.example
MAIL_FROM_NAME=Continium EDC (Demo)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=<brevo-smtp-login>
SMTP_PASSWORD=<brevo-smtp-master-key>
SMTP_SECURE_ENABLED=0   # STARTTLS (port 587), not implicit TLS (port 465)
SMTP_AUTHENTICATED=1
SMTP_REJECT_UNAUTHORIZED_TLS=1
```

### Fallback / upgrade path: Resend (free 3K/mo, requires verified domain)

When the project owns a domain (e.g. `continium.com` or a temporary alt):

```
Provider : Resend
Plan     : Free (3,000 emails/mo, 100/day)
Identity : DKIM-signed by the verified domain — best deliverability
SMTP host: smtp.resend.com   (or use HTTP API via @react-email/render + resend SDK)
SMTP port: 587
```

`@continium/email` already uses `nodemailer` — both providers slot in without code changes.

### Why not Mailhog in production

Mailhog is a dev-only catcher. The current `docker-compose.dev.yml` uses it. Production must point at Brevo/Resend.

### Sandbox-domain testing (no domain owned yet)

For the period before a domain is purchased:

- Brevo accepts any `MAIL_FROM` — emails will land in spam often but **will** deliver to most providers.
- Alternative: keep using Mailhog locally + use Brevo only for the deployed staging URL.
- Sandbox testing addresses (Mailtrap free, Mailosaur free) can be used to verify content without spamming real inboxes during pre-launch QA.

## Related code files

No code edits expected. Verify only:

- `packages/email/src/index.ts` — uses `nodemailer.createTransport` from `SMTP_*` env vars.
- `packages/email/src/templates/` — verify all templates use `${WEBAPP_URL}` for links.
- `apps/web/modules/auth/lib/email-verification.ts` (or similar)
- `apps/web/modules/organization/lib/invite.ts` (or similar)

## Implementation steps

1. **Sign up** for Brevo (`brevo.com`) — free tier requires email + name.
2. **Skip identity verification** (not needed for SMTP relay on free tier — different from "Marketing" features).
3. **Navigate to SMTP & API → SMTP** → generate a master key if using an SMTP-compatible host.
4. Confirm the EDC app host is Vercel Hobby. If it ever moves to Render free, do not set only SMTP vars and expect email to work; add an HTTPS Brevo API or Resend API adapter first.
5. **Trigger redeploy**.
6. **Test registration email**:
   - Visit the public URL.
   - Register with a real email you control.
   - Check inbox (and spam folder!) within 60 s. Click verification link.
7. **Test password-reset email**:
   - From login page, click "Forgot password".
   - Same check.
8. **Test invitation email**:
   - Log in → org settings → invite a teammate (use a second real email).
   - Same check.
9. **Verify links**: every email link should start with `https://continium-edc.vercel.app/...` (your real public URL), never `localhost`.
10. **Document spam-folder caveat** in the public README — sender reputation without a verified domain is poor.

### Future SPF / DKIM / DMARC (when a domain is acquired)

When `continium.com` (or the chosen domain) is registered:

1. Switch email provider preference to **Resend** (better deliverability than Brevo for branded sender).
2. In the DNS provider, add the three records Resend supplies:
   - SPF: `v=spf1 include:_spf.resend.com -all`
   - DKIM: `resend._domainkey CNAME resend.com.<random>.dkim.amazonses.com` (Resend supplies exact value)
   - DMARC: `_dmarc TXT v=DMARC1; p=quarantine; rua=mailto:dmarc-report@<your-domain>`
3. Verify in Resend dashboard.
4. Update `MAIL_FROM` to `noreply@<your-domain>`.
5. Roll out — no code changes needed (still `nodemailer` SMTP or swap to Resend HTTP API).

## Success criteria

- [ ] Brevo SMTP credentials in Vercel env vars.
- [ ] Registration → verification email arrives.
- [ ] Password reset → email arrives.
- [ ] Org invite → email arrives.
- [ ] All email links point at the public HTTPS URL.
- [ ] Email throughput tested (send 5 in a minute; confirm no rate-limit error).
- [ ] README documents spam-folder caveat for free-tier sender.

## Risk assessment

| Risk                                                           | Likelihood | Impact | Mitigation                                                                                  |
| -------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------- |
| Brevo free flagged as spam (no DKIM on your domain)            | High       | Medium | Acceptable for staging. Switch to Resend with verified domain in Phase 8                    |
| Render free blocks SMTP ports `25/465/587` if app host changes | Low now    | High   | Keep Vercel Hobby for the demo, or add HTTPS email API adapter before moving to Render free |
| 300/day cap hit during demos                                   | Low        | Medium | Plan demos in batches; pause registration if needed                                         |
| `MAIL_FROM` mismatch with verified-sender → bounces            | Medium     | High   | Brevo SMTP relay accepts any `MAIL_FROM`; double-check in Brevo dashboard                   |
| `nodemailer` STARTTLS handshake fails on Vercel runtime        | Low        | High   | Test registration, reset, and invite flows immediately after deploy                         |
| Email template hardcoded `localhost` link                      | Medium     | High   | Grep `packages/email/src/templates/` for `localhost`; fix any                               |

## Security considerations

- SMTP password is a high-value secret — Vercel env var, never in repo.
- Subject lines & body must not include patient identifiers (clinical workflow consideration).
- DMARC `p=quarantine` is the recommended starting policy; tighten to `p=reject` after 30 days of clean reports.
- Webhook handling for bounces / complaints — Brevo free tier doesn't include webhooks; accept the gap or use Resend (which does on its free tier).

## Next steps

- Phase 7: full smoke test including all email-triggered flows.
- Phase 8 (future): domain + DKIM/SPF/DMARC + Resend swap.
