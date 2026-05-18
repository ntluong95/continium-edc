# Free-Tier Deployment Checklist

> Single-page operator runbook. Tick each row as you go. Skip rows that don't apply (e.g. R2 deferred). Save the filled-in copy to the public repo as evidence of the smoke pass.

**Last verified:** _<fill in date>_
**Operator:** _<fill in name>_
**Public URL:** _<fill in>_
**License server URL:** _<fill in>_

---

## 0. Preconditions

- [ ] `plans/260517-1605-continium-licensing-refactor` is complete (entitlements no longer import `@/modules/ee/*`).
- [ ] `apps/web/modules/ee/LICENSE` attribution reviewed with counsel.
- [ ] Public `continium-edc` repo created on GitHub, AGPLv3.
- [ ] Private `continium-license-server` repo created on GitHub, "All rights reserved".

---

## 1. Repository separation (Phase 1)

- [ ] Public repo `pnpm install` succeeds on fresh clone.
- [ ] Public repo `pnpm --filter @continium/web typecheck` succeeds.
- [ ] Public repo `pnpm --filter @continium/web build` succeeds.
- [ ] `rg "modules/ee" continium-edc/apps continium-edc/packages` returns 0 lines.
- [ ] `rg "license-server|@continium-internal" continium-edc/` returns 0 lines.
- [ ] `gitleaks detect --no-git --redact -v --source continium-edc` is clean.
- [ ] `gitleaks detect --no-git --redact -v --source continium-license-server` is clean.
- [ ] Public README mentions AGPL + Formbricks attribution + free-tier PHI banner.
- [ ] Private README explains it is NOT to be public-mirrored.

---

## 2. App preparation (Phase 2)

- [ ] `apps/web/next.config.mjs` has `output: 'standalone'`.
- [ ] Local smoke flow (Mailhog + local Postgres + local Redis) completes: register → verify → log in → create org → create project → invite teammate → submit form.
- [ ] `docker build` succeeds; image runs the smoke flow locally.
- [ ] `deployment/env.continium-edc.example` matches the env vars actually read at boot.

---

## 3. Backing services (Phase 3)

### 3.1 Supabase (EDC primary DB)

- [ ] Project `continium-edc-staging` created in chosen region.
- [ ] pgvector extension enabled.
- [ ] `DATABASE_URL` (pooler) saved.
- [ ] `DIRECT_URL` (5432) saved.
- [ ] `psql $DIRECT_URL -c "select 1"` succeeds.

### 3.2 Supabase (License DB — separate project)

- [ ] Project `continium-license-staging` created in same region.
- [ ] `LICENSE_DATABASE_URL` saved.
- [ ] `psql $LICENSE_DATABASE_URL -c "select 1"` succeeds.

### 3.3 Upstash Redis

- [ ] DB `continium-cache` created in matching region.
- [ ] `REDIS_URL` (rediss://...) saved.
- [ ] REST URL + token saved.
- [ ] `redis-cli -u "$REDIS_URL" PING` returns PONG.

### 3.4 Cloudflare R2 (optional first-run)

- [ ] R2 bucket `continium-edc-uploads` created.
- [ ] R2 API token created with Object Read & Write scope.
- [ ] S3 endpoint URL saved.

---

## 4. EDC app deploy (Phase 4)

### 4.1 Vercel Hobby

- [ ] Vercel project for `continium-edc` repo created with root directory `apps/web`.
- [ ] All env vars from `deployment/env.continium-edc.example` filled in Vercel Dashboard.
- [ ] `CONTINIUM_EDITION=selfHosted` initially.
- [ ] Brevo SMTP configured; Vercel Hobby can use SMTP 587 with the current `nodemailer` path.
- [ ] Worker strategy recorded: worker-backed flows explicitly deferred for $0 demo.
- [ ] `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` saved as GitHub secrets.
- [ ] `.github/workflows/migrate-and-deploy-free-tier.yml` committed.
- [ ] First deploy succeeds (build log clean).
- [ ] Migrations applied (`psql $DIRECT_URL -c "\dt"` lists expected tables).
- [ ] `curl https://<app>.vercel.app/api/health` → 200.
- [ ] No pg-boss worker created for the $0 demo; deferred worker-backed flows are listed in section 9.

### 4.2 Smoke flow on deployed URL

- [ ] Register new user.
- [ ] Verification email arrives (check spam folder).
- [ ] Click verify link → land on dashboard.
- [ ] Create organization.
- [ ] Create project.
- [ ] Create development + production environments.
- [ ] Invite teammate by email.
- [ ] Teammate receives invite email → accepts → joins org.
- [ ] Create a normal form.
- [ ] Publish the form.
- [ ] Submit a response from a public URL (incognito).
- [ ] Response visible in Summary + Response Details.

---

## 5. License server deploy (Phase 5)

- [ ] Vercel project `continium-license-server` imported from private repo.
- [ ] All env vars from `deployment/env.license-server.example` filled in Vercel Dashboard.
- [ ] `CONTINIUM_LICENSE_ADMIN_TOKEN` is 32+ chars.
- [ ] First deploy succeeds.
- [ ] `curl https://<ls>.vercel.app/api/health` → `{ status: "ok", db: "up" }`.
- [ ] Demo license seeded via current `POST /api/admin/licenses` route with Bearer token, unless route migration already landed.
- [ ] License key saved to current `ENTERPRISE_LICENSE_KEY` in EDC env, unless Continium API-key rename already landed.
- [ ] EDC env uses a valid `CONTINIUM_LICENSE_SERVER_URL`; `CONTINIUM_EDITION=cloud` only if code now supports it.
- [ ] EDC redeploys; logs show license-check traffic to the implemented route (`/api/licenses/check` today).
- [ ] Cloud-mode features respect the seeded license entitlements.
- [ ] Outage test: Vercel project paused → EDC continues serving after cache TTL (no 5xx).
- [ ] Recovery test: Vercel project resumed → next check succeeds; cache refilled.
- [ ] Self-hosted test: EDC reverted to `CONTINIUM_EDITION=selfHosted` → no license-server traffic in Vercel access logs.

---

## 6. Email setup (Phase 6)

- [ ] Brevo SMTP master key generated for Vercel Hobby.
- [ ] EDC env email vars filled for the implemented transport.
- [ ] Registration email arrives (check spam).
- [ ] Password-reset email arrives.
- [ ] Invitation email arrives.
- [ ] All links in emails point to the deployed URL (not localhost).
- [ ] No grep hit for `localhost` in `packages/email/src/templates/`.

---

## 7. Production-like QA (Phase 7)

### 7.1 Auth & invites

- [ ] Login / logout works.
- [ ] Forgot password works end-to-end.
- [ ] Invited user can accept after creating account.

### 7.2 Normal form flow

- [ ] Create normal form with 3 field types.
- [ ] Publish.
- [ ] Submit public response.
- [ ] Summary tab shows response.
- [ ] Response Details tab shows full data.

### 7.3 Clinical flow

- [ ] Switch project to Clinical EDC mode (via `convert-to-clinical-action`).
- [ ] Clinical onboarding completes.
- [ ] Template-based clinical project creates successfully.
- [ ] Create subject; subject ID auto-generated.
- [ ] Enter subject data; audit log entry appears.
- [ ] Clinical response appears in form Summary / Response Details.

### 7.4 License server flows

- [ ] Cloud mode license check works.
- [ ] License outage → graceful fallback.
- [ ] Recovery → fresh license check.
- [ ] Self-hosted mode → no license calls.

### 7.5 Workspace + misc

- [ ] Workspace integrations page renders.
- [ ] `/api/health` returns 200.

### 7.6 Security spot checks

- [ ] TLS valid on every endpoint (`curl -I https://...`).
- [ ] License admin endpoint returns 401 without Bearer token.
- [ ] Registration rate-limit fires after threshold.
- [ ] No secrets in HTML / JS / network responses (DevTools spot-check).
- [ ] `gitleaks` clean on both repos after smoke completes.

---

## 8. Public-share gate

Public-share the URL only if **every Phase 1–7 row above is checked OR explicitly marked "deferred (reason)" in writing**.

- [ ] PHI banner mounted on signup page and README.
- [ ] Sender domain caveat documented in README.
- [ ] Cold-start expectation documented in README.
- [ ] Operator contact / support email published.

---

## 9. Deferred items (record reasons here)

| Item              | Reason                           | Owner  | Next review |
| ----------------- | -------------------------------- | ------ | ----------- |
| _e.g. R2 uploads_ | _e.g. not needed for first demo_ | _name_ | _date_      |
|                   |                                  |        |             |
|                   |                                  |        |             |

---

## 10. Post-deployment housekeeping

- [ ] Delete test accounts / orgs from the demo after Phase 7 passes (do not leave populated demo data on a public URL).
- [ ] Tag both repos `v0.1.0-staging`.
- [ ] Open follow-up issues for any deferred items.
- [ ] Schedule a 30-day review to decide on paid migration (Phase 8 triggers).

---

## 11. Operator emergency contacts

| Service    | Console URL                    | Account email | Notes                               |
| ---------- | ------------------------------ | ------------- | ----------------------------------- |
| Vercel     | https://vercel.com/dashboard   | _<fill>_      | EDC web + license server            |
| Render     | https://dashboard.render.com   | _<fill>_      | Future paid worker or fallback only |
| Supabase   | https://supabase.com/dashboard | _<fill>_      | EDC DB + License DB                 |
| Upstash    | https://console.upstash.com    | _<fill>_      | Redis                               |
| Cloudflare | https://dash.cloudflare.com    | _<fill>_      | R2                                  |
| Brevo      | https://app.brevo.com          | _<fill>_      | SMTP                                |
| GitHub     | https://github.com             | _<fill>_      | Repos + Actions                     |
