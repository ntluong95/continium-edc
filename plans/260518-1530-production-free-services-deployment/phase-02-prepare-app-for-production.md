---
phase: 2
title: "Prepare app for production"
status: complete
priority: P1
effort: "1d"
dependencies: [1]
---

# Phase 2: Prepare app for production

## Overview

Make the staged public `continium-edc` repo deployable to **any** Node host without local rewrites. Verify build/start/migration scripts, baseline env config, registration flow, and the existing `Dockerfile`. **No new features.**

## Context links

- Existing Dockerfile: `apps/web/Dockerfile` (if present)
- `apps/web/package.json` scripts: `dev`, `build`, `start`, `db:migrate:deploy` (verify)
- Public registration flow lives in `apps/web/modules/auth/`
- Self-hosting docs already exist at `docs/self-hosting/`

## Requirements

### Functional

- `pnpm install` works on a clean checkout (Node 20.18.1+, pnpm 10.32.1+).
- `pnpm --filter @continium/web build` succeeds with only public env vars.
- `pnpm --filter @continium/web start` boots the server.
- `pnpm --filter @continium/database migrate:deploy` runs DB migrations against an empty database.
- Default seed (`apps/web/scripts/seed.ts` if exists) only seeds non-PII reference data.
- Public registration toggle (`SIGNUP_DISABLED=0` — or whatever env name exists) leaves registration **on** by default.
- Invitation email path (`apps/web/modules/organization/...`) wired to `nodemailer` via SMTP env vars.

### Non-functional

- Vercel build completes with the monorepo package filters and Hobby function limits.
- Docker image remains usable for future paid/container hosts; target size ≤ 1 GB after multi-stage build.
- All deployment secrets are read from `process.env`; no hard-coded fallback secrets.
- All secrets read from `process.env`; no hard-coded fallback secrets.

## Architecture

### Build & start chain (target host: Vercel Hobby; Docker path kept for future paid hosts)

```
prebuild: pnpm install --frozen-lockfile
build:    pnpm --filter @continium/database generate
          pnpm --filter @continium/web build
release:  pnpm --filter @continium/database migrate:deploy
start:    pnpm --filter @continium/web start  (Next.js standalone)
```

For Vercel: migrations should NOT run during `next build` (build is parallel & ephemeral). Use a manually-triggered `vercel.json` cron OR a one-shot `npx prisma migrate deploy` from CI after deploy completes. Recommended approach for the free stack: **run migrations via GitHub Actions on push to `main`, deploy app afterwards.**

### Dockerfile review checklist

Open `apps/web/Dockerfile` (or root `Dockerfile`) and verify:

- Uses Node 20.18+ base image.
- Multi-stage: `deps → build → runner`.
- Final stage runs `node server.js` (Next.js standalone) — NOT `next start`.
- Final stage uses non-root user (`nextjs`/`node`).
- `NEXT_TELEMETRY_DISABLED=1` set.
- `HEALTHCHECK` present (or platform health-check via `/api/health`).
- No `apt install postgresql-client` unless `pg_isready` actually used.

If Dockerfile is missing or broken, generate a fresh one based on the official Next.js sample, adjusted for the pnpm workspace.

### Env config sanity

Use the [`deployment/env.continium-edc.example`](../../deployment/env.continium-edc.example) deliverable from this plan as the source of truth. **Every** variable read at runtime must have:

- A row in the example file.
- A Zod schema entry in `apps/web/lib/env.ts` (using `@t3-oss/env-nextjs` per existing code).
- A sensible default OR an explicit "required" marker.

Things to verify exist:

- `WEBAPP_URL`, `NEXTAUTH_URL` — required.
- `ENCRYPTION_KEY`, `NEXTAUTH_SECRET`, `CRON_SECRET` — required, 32+ hex chars.
- `DATABASE_URL`, `JOBS_DATABASE_URL` (optional fallback to DATABASE_URL).
- `REDIS_URL` — optional but recommended.
- `S3_*` set — required for file uploads on serverless hosts (no local FS).
- `SMTP_*` set — required for invite/reset emails on Vercel Hobby.
- `CONTINIUM_EDITION=selfHosted` — default.
- `CONTINIUM_LICENSE_SERVER_URL` — empty by default (selfHosted needs nothing).
- `CONTINIUM_INSTANCE_ID` — auto-generated at boot if missing? Verify the licensing package handles this.

### Health endpoint

Existing: most Formbricks-derived apps already ship `/api/health`. Verify it returns `200` and **does not** require auth. Required for Render/Vercel auto-recovery.

## Related code files

### Files to read & verify (no edits unless broken)

- `apps/web/Dockerfile` (or root `Dockerfile`)
- `apps/web/next.config.mjs` — ensure `output: 'standalone'`
- `apps/web/lib/env.ts` (or similar @t3-oss/env-nextjs config)
- `apps/web/app/api/health/route.ts`
- `packages/database/package.json` — `migrate:deploy` script
- `apps/web/scripts/seed.ts` (if exists)

### Files to add (in public repo root)

- `deployment/env.continium-edc.example` — created from this plan's deliverable
- `deployment/free-deployment-checklist.md` — created from this plan's deliverable
- `.github/workflows/migrate-and-deploy-free-tier.yml` — runs migrations before Vercel deploy

### Files to modify (minimal)

- `apps/web/next.config.mjs` — ensure `output: 'standalone'` for slim Docker image
- `package.json` (root) — add `scripts.release` pointing to `pnpm --filter @continium/database migrate:deploy`
- `apps/web/Dockerfile` — fix only if review checklist fails

## Implementation steps

1. **Verify** `apps/web/Dockerfile` against the review checklist. Capture diff if changes needed but do not apply yet.
2. **Verify** `next.config.mjs` → `output: 'standalone'` is set (Vercel ignores; Render/Fly use it).
3. **Run locally** with prod-like env:
   - Copy `deployment/env.continium-edc.example` → `.env.local`
   - Fill DB to local Postgres + Mailhog SMTP.
   - `pnpm --filter @continium/database generate && pnpm --filter @continium/database migrate:deploy`
   - `pnpm --filter @continium/web build`
   - `pnpm --filter @continium/web start`
   - In a browser: register → confirm email link in Mailhog → log in → create organization → create project → invite a teammate (use a second incognito session).
4. **Run docker build locally** if Dockerfile is intended path:
   - `docker build -t continium-edc:test -f apps/web/Dockerfile .`
   - `docker run --env-file .env.local -p 3000:3000 continium-edc:test`
   - Same smoke flow as step 3.
5. **Run secret scan** on built image: `docker run --rm -v $(pwd):/scan zricethezav/gitleaks:latest detect --no-git -v --source /scan` — must return clean.
6. **Document** any breakage discovered → flag in plan's "Open questions" for follow-up.

## Success criteria

- [ ] `pnpm install` + `pnpm --filter @continium/web build` succeed from a fresh clone.
- [ ] Migrations apply cleanly to an empty Postgres.
- [ ] Local smoke flow (register → org → project → invite → submit form) passes.
- [ ] `docker build` succeeds and the resulting image runs the smoke flow.
- [ ] No secrets in image (`gitleaks` clean).
- [ ] `deployment/env.continium-edc.example` matches the env vars actually read at boot.

## Risk assessment

| Risk                                                                          | Likelihood | Impact            | Mitigation                                                                                                      |
| ----------------------------------------------------------------------------- | ---------- | ----------------- | --------------------------------------------------------------------------------------------------------------- |
| `next.config.mjs` not set to `standalone` → Docker image bloat                | Medium     | Medium            | Verify in step 2                                                                                                |
| `@t3-oss/env-nextjs` throws at boot for a missing optional var                | Medium     | High (boot crash) | Walk env schema; mark optional vars `.optional()`                                                               |
| Background-worker pg-boss needs a real worker process the free host won't run | High       | Medium            | Phase 4 addresses — paid worker, alternate worker design, or explicitly skip worker-backed flows for early demo |
| Free DB pause races with migrations                                           | Low        | Low               | Migrations run on every deploy; if DB paused, first run wakes it                                                |
| `heic-convert` binary fails to install on serverless                          | Medium     | Low               | Vercel: known good. Render: known good. Cloudflare Workers: incompatible (not the target).                      |

## Security considerations

- All cookies set `Secure; HttpOnly; SameSite=Lax` in production. Verify `next-auth` config.
- CSP header should be set in `next.config.mjs` headers().
- Rate-limit registration endpoint to prevent abuse on a public URL.
- Captcha (`TURNSTILE_*` or `RECAPTCHA_*`) optional but recommended on a public free-tier URL.

## Next steps

- Phase 3: Provision DB + Redis.
- Phase 4: Deploy the actual app once env config is verified locally.
