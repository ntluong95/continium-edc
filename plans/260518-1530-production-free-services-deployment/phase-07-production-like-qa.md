---
phase: 7
title: "Production-like QA"
status: blocked-by-database-provisioning
priority: P1
effort: "1d"
dependencies: [4, 5, 6]
---

# Phase 7: Production-like QA

## Current status — 2026-05-19

Automated smoke covered deployment reachability only:

- `https://continium-edc.vercel.app/` → 200.
- `https://continium-edc.vercel.app/auth/signup` → 200.
- `https://continium-license-server.vercel.app/` → 200.
- `https://continium-license-server.vercel.app/api/admin/licenses` without bearer → 401.

Blocked before manual QA: both apps still need hosted database URLs. License health is degraded, and EDC production env still contains placeholder DB URLs, so registration/trial cannot pass yet.

## Overview

Manual end-to-end smoke test against the deployed free-tier stack. Covers normal Formbricks-derived form flows, clinical EDC mode, license server modes (cloud / selfHosted / unavailable), and basic security checks. Pass = green-light public sharing of the demo URL.

## Context links

- Live URL from Phase 4
- License server URL from Phase 5
- Email provider from Phase 6
- [`deployment/free-deployment-checklist.md`](../../deployment/free-deployment-checklist.md) — single-page checklist for the operator

## Requirements

### Functional

Each scenario in the test matrix below must pass against the deployed stack (not localhost). Tester records pass/fail in the checklist deliverable.

### Non-functional

- 95th-percentile page-load (warm app): ≤ 3 s.
- Cold start after spin-down: ≤ 90 s. Document this in README; don't block on it.
- No 5xx errors during any test scenario. 4xx errors only where expected (e.g. invalid login → 401).
- All emails delivered to inbox within 60 s.

## Test matrix

| #   | Scenario                               | Steps                                                                                                                                         | Expected                                                             |
| --- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | New-user registration                  | Visit URL → /auth/signup → submit → check email → click verify link                                                                           | Land on /environments — empty state                                  |
| 2   | Login / logout                         | After (1) → sign out → /auth/login → re-sign-in                                                                                               | Re-enter dashboard                                                   |
| 3   | Create organization                    | Settings → create organization → name "Test Org"                                                                                              | Org appears in nav                                                   |
| 4   | Create project                         | Org → new project → name "Test Project" → choose "Normal" mode                                                                                | Project home renders                                                 |
| 5   | Create environments                    | Project → settings → environments → add "Development" + "Production"                                                                          | Two environments visible                                             |
| 6   | Invite teammate                        | Org → members → invite by email                                                                                                               | Invite email arrives at 2nd email                                    |
| 7   | Accept invite                          | 2nd email → click invite link → register (or log in) → accept                                                                                 | 2nd user appears in org members                                      |
| 8   | Create normal form                     | Project → /forms → new → add 3 fields (text, choice, rating) → save                                                                           | Form draft saved                                                     |
| 9   | Publish normal form                    | Open form → publish                                                                                                                           | Public link generated                                                |
| 10  | Submit normal form response            | Open public link in incognito → fill → submit                                                                                                 | Response captured                                                    |
| 11  | View Summary & Response Details        | Form → Summary tab → Response Details tab                                                                                                     | Submission visible with details                                      |
| 12  | Switch to Clinical project mode        | Project → settings → convert to clinical                                                                                                      | Clinical sidebar appears                                             |
| 13  | Clinical onboarding                    | Follow onboarding wizard                                                                                                                      | Onboarding completes                                                 |
| 14  | Create clinical template project       | Project picker → "From template" → choose clinical template                                                                                   | New project from template                                            |
| 15  | Subject creation                       | Clinical project → subjects → new subject                                                                                                     | Subject ID generated                                                 |
| 16  | Subject data entry                     | Open subject → fill instrument → save                                                                                                         | Data persisted; audit log entry visible                              |
| 17  | Clinical response appears in Summary   | Form Summary / Response Details for the clinical instrument                                                                                   | Submission listed                                                    |
| 18  | Workspace integrations page            | Settings → integrations                                                                                                                       | Page renders (integrations may be disabled on free tier — OK)        |
| 19  | License check works (implemented mode) | Use current legacy env (`ENTERPRISE_LICENSE_KEY`) or future cloud env only after code supports it → redeploy → trigger a feature-gated action | Feature available; logs show license-check call to implemented route |
| 20  | License server unavailable             | Stop license-server Vercel project → wait > TTL → trigger feature-gated action                                                                | App still responds (fallback or cached) — no 5xx                     |
| 21  | License-server recovers                | Restart license-server → trigger action                                                                                                       | Fresh license-check call; entitlements reload                        |
| 22  | Self-hosted mode                       | Switch EDC to `CONTINIUM_EDITION=selfHosted` → redeploy → use clinical features                                                               | All clinical defaults available; no license-server traffic in logs   |
| 23  | Logout + login retry                   | Standard auth retry                                                                                                                           | Works without stale-cookie issues                                    |
| 24  | Forgot password                        | /auth/login → forgot → enter email → check inbox → reset → log back in                                                                        | Password updated                                                     |
| 25  | Health endpoint                        | `curl ${WEBAPP_URL}/api/health`                                                                                                               | 200 OK                                                               |

## Smoke flows that we explicitly defer

- File uploads to R2 — only test if R2 was wired in Phase 4. Otherwise mark "deferred to Phase 8".
- Webhooks to internal IPs (`DANGEROUSLY_ALLOW_WEBHOOK_INTERNAL_URLS`) — stay disabled.
- OAuth login (Google/GitHub) — skip on free tier unless credentials available.
- Payments — Phase 8 (no payment provider wired on free tier).

## Security spot-checks

| #   | Check                                             | Method                                                                                  |
| --- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| S1  | TLS on every endpoint                             | `curl -I https://...` shows valid cert                                                  |
| S2  | `NEXTAUTH_SECRET` is 32+ random bytes             | Verify in Vercel env, redacted in logs                                                  |
| S3  | `/api/health` doesn't leak commit / env           | Inspect response body                                                                   |
| S4  | License admin endpoint rejects unauth requests    | `curl -X POST .../api/admin/licenses` → 401, unless route migration already landed      |
| S5  | Registration rate-limit fires after N submissions | Submit 10 in 1 min → expect 429 after threshold                                         |
| S6  | Email links don't include session tokens          | Inspect verification email; link should contain a one-time code, not the user's session |
| S7  | No secrets in HTML / network responses            | DevTools → search for `sk_`, `service_role`, `nextauth_secret` — must be empty          |

## Related code files

No code edits. QA only.

## Implementation steps

1. **Tester** opens `deployment/free-deployment-checklist.md` and runs each row in order.
2. **For each failed row**: capture screenshot + URL + timestamp + Vercel logs excerpt → attach to a GitHub issue in `continium-edc` repo.
3. **Block public sharing** until all P1 rows pass. P2 rows (clinical template, workspace integrations) acceptable as "demo-known-issues".
4. **License-server outage test** (#20): use the Vercel "Pause Production Deployments" toggle; do **not** delete the deployment.
5. **Post-QA**, commit the filled-in checklist to the public repo as evidence of the smoke pass.

## Success criteria

- [ ] Rows 1–18 pass (Formbricks-derived flows + clinical mode).
- [ ] Rows 19–22 pass (license server modes).
- [ ] Rows 23–25 pass (auth edges + health).
- [ ] Security spot-checks S1–S7 pass.
- [ ] Deferred items (R2, OAuth, webhooks, payments) explicitly noted in the checklist.

## Risk assessment

| Risk                                                                 | Likelihood | Impact | Mitigation                                                                                                 |
| -------------------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| QA pass on a quiet day; production fails under real load             | Medium     | Medium | Free tier is NOT for real load. Document explicitly in README                                              |
| Clinical template seeding pulls from a removed-EE source             | Medium     | Medium | Verify via `pnpm test:coverage:clinical` against the staged repo                                           |
| Email lands in spam → tester misses verification email               | High       | Low    | Tester checks spam folder; documented                                                                      |
| License-server fallback path silently picks wrong feature set        | Medium     | High   | Verify in test #20 that clinical-EDC and audit-log remain enabled in fallback (compliance-locked features) |
| Rate-limit configuration too aggressive on free tier → blocks tester | Medium     | Medium | Adjust per `apps/web/lib/rate-limit.ts` if needed                                                          |

## Security considerations

- Tester accounts should use throwaway emails (e.g. `+tag` Gmail aliases).
- After QA, delete or anonymize the test organizations / subjects — do not leave them populated on the demo URL.
- License admin token must NOT be checked into the public repo by mistake — verify with `gitleaks` after Phase 7 closes.

## Next steps

- Public-share the URL only after this phase is green.
- Phase 8 (future) — migration to paid tier when traffic / commercial requirements appear.
