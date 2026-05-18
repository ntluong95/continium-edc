# REDCap → Modern Platform: Architecture & Migration Plan

**Stack:** TypeScript · Next.js (App Router) · React · TailwindCSS · Prisma · Auth.js · Zod · Vitest
**Source baseline:** REDCap 15.8.4 — 231 tables, 2,207 columns, 180 declared FK edges (per `redcap_schema_stats.txt`).
**Document conventions:** `[CONFIRMED]` = directly from supplied schema/audit; `[INFERRED]` = derived from naming/structure; `[ASSUMPTION]` = needs validation against runtime/PHP code.

---

## A. Executive Architecture Summary

REDCap is a 20-year-old PHP monolith on MySQL. Its 231 tables encode a research data-capture platform that combines: project metadata, dynamic form definitions (EAV), longitudinal event/arm scheduling, a survey engine, RBAC + Data Access Groups (DAGs), an audit log, e-consent/e-signatures, and many optional modules (MyCap, EHR/FHIR, Twilio, rewards, external modules).

We will rebuild this as a **modular Next.js + Prisma application** inspired by the Formbricks layout (App Router app + shared `packages/*` for `database`, `auth`, `ui`, `validation`, `types`, `logger`, `test-utils`). Key architectural shifts:

1. **Dynamic shards → repository abstraction.** REDCap's `redcap_data`, `redcap_data2..6` and `redcap_log_event..12` shards are hidden behind a `RecordRepository` and `AuditRepository`. The new model uses a single canonical `RecordValue` and `AuditLog` table with proper indexing/partitioning (Postgres declarative partitioning).
2. **EAV stays — but typed.** Field values remain row-per-(record, event, instance, field) to preserve REDCap's flexibility and migration parity, but are augmented by **typed columns** (`valueText`, `valueNumber`, `valueDate`, `valueJson`, `valueFileId`) and an explicit `Field.type` enum. JSONB is used only for repeating-instrument response payloads in the survey engine and for raw imports.
3. **Draft/production metadata** (`redcap_metadata` vs `redcap_metadata_temp`) is replaced by a single `Field` table with a `MetadataRevision` history model (snapshot per production push).
4. **RBAC redesigned** as RBAC+ABAC: `Role` (project-template), `Membership` (user↔project↔role), `DataAccessGroup`, with permissions resolved by a single `can(user, action, resource)` helper.
5. **Audit log is append-only** (Postgres partitioned by month) with a typed `event` discriminator.
6. **Auth.js** replaces `redcap_auth` / `redcap_sessions` / `redcap_two_factor_response` (password, TOTP, magic link, OAuth providers all supported natively).
7. **Compatibility-first migration**: legacy primary keys preserved on every migrated table via `legacyId Int? @unique` to enable shadow-reads and rollback.

---

## B. Legacy REDCap Domain Map

Grouped from `redcap_tables.txt` (231 tables). Counts are approximate; full per-table mapping in section G.

| # | Domain | Representative legacy tables | MVP? | Notes |
|---|--------|------------------------------|------|-------|
| 1 | System config | `redcap_config`, `redcap_validation_types`, `redcap_auth_questions`, `redcap_ip_banned`, `redcap_ip_cache` | Partial | Keep `config` + `validation_types`; rest is ops. |
| 2 | Users & auth | `redcap_user_information`, `redcap_auth`, `redcap_auth_history`, `redcap_two_factor_response`, `redcap_sessions`, `redcap_user_allowlist` | ✅ | Replace with Auth.js + custom `User` profile. |
| 3 | Roles & permissions | `redcap_user_roles`, `redcap_user_rights` | ✅ | Redesign as `Role` + `Membership` + `Permission` enum. |
| 4 | Projects | `redcap_projects`, `redcap_projects_external`, `redcap_projects_templates`, `redcap_projects_user_hidden`, `redcap_project_checklist`, `redcap_folders`, `redcap_folders_projects` | ✅ | `redcap_projects` is the single biggest hub (`project_id` is FK in 80+ tables). |
| 5 | Project metadata (fields) | `redcap_metadata`, `redcap_metadata_temp`, `redcap_metadata_archive`, `redcap_metadata_prod_revisions` | ✅ | Collapse to `Field` + `FieldRevision`. |
| 6 | Forms / instruments | `redcap_forms`, `redcap_forms_temp`, `redcap_instrument_zip`, `redcap_instrument_zip_authors`, `redcap_instrument_zip_origins` | ✅ | `Form` + later `FormTemplate`. |
| 7 | Events & arms (longitudinal) | `redcap_events_arms`, `redcap_events_metadata`, `redcap_events_forms`, `redcap_events_repeat`, `redcap_events_calendar`, `redcap_events_calendar_feed` | ✅ | Core for longitudinal projects. |
| 8 | Records / data | `redcap_data`, `redcap_data2..6`, `redcap_record_list`, `redcap_record_counts`, `redcap_record_dashboards`, `redcap_new_record_cache`, `redcap_record_background_delete*` | ✅ | Collapse 6 shards → one partitioned `RecordValue` table. |
| 9 | Surveys | `redcap_surveys`, `redcap_surveys_themes`, `redcap_surveys_short_codes` | ✅ | |
| 10 | Survey participants | `redcap_surveys_participants`, `redcap_surveys_phone_codes`, `redcap_surveys_login` | ✅ | |
| 11 | Survey responses | `redcap_surveys_response`, `redcap_surveys_pdf_archive` | ✅ | Response = link from participant → record-state at submit time. |
| 12 | Survey scheduling | `redcap_surveys_emails`, `redcap_surveys_emails_recipients`, `redcap_surveys_emails_send_rate`, `redcap_surveys_queue`, `redcap_surveys_queue_hashes`, `redcap_surveys_scheduler`, `redcap_surveys_scheduler_queue`, `redcap_surveys_scheduler_recurrence`, `redcap_surveys_erase_twilio_log` | Phase 2 | Background-job heavy. |
| 13 | DAGs | `redcap_data_access_groups`, `redcap_data_access_groups_users` | ✅ | |
| 14 | Reports & dashboards | `redcap_reports`, `redcap_reports_fields`, `redcap_reports_access_*`, `redcap_reports_edit_access_*`, `redcap_reports_filter_*`, `redcap_reports_folders*`, `redcap_reports_ai_prompts`, `redcap_project_dashboards*`, `redcap_record_dashboards` | ✅ minimal | MVP = list/filter/export; dashboards Phase 3. |
| 15 | Data quality | `redcap_data_quality_rules`, `redcap_data_quality_status`, `redcap_data_quality_resolutions` | Phase 3 | |
| 16 | Audit / logs | `redcap_log_event`, `redcap_log_event2..12`, `redcap_log_view`, `redcap_log_view_old`, `redcap_log_view_requests`, `redcap_page_hits`, `redcap_error_log`, `redcap_outgoing_email_*` | ✅ (single `AuditLog`) | Shards replaced by Postgres partitioning. |
| 17 | File / document storage | `redcap_edocs_metadata`, `redcap_edocs_data_mapping`, `redcap_docs`, `redcap_docs_attachments`, `redcap_docs_folders`, `redcap_docs_folders_files`, `redcap_docs_share`, `redcap_docs_to_edocs`, `redcap_pdf_image_cache`, `redcap_pdf_snapshots`, `redcap_pdf_snapshots_triggered` | ✅ (subset) | `FileObject` + `FileBinding` (poly relation). |
| 18 | E-consent & e-signatures | `redcap_econsent`, `redcap_econsent_forms`, `redcap_esignatures` | Phase 3 | Required for compliance use cases. |
| 19 | API tokens | columns on `redcap_user_information` + `redcap_user_rights` (`api_token`) | ✅ small | Modeled as `ApiToken` table. |
| 20 | External modules | `redcap_external_modules`, `redcap_external_module_settings`, `redcap_external_modules_downloads`, `redcap_external_modules_log`, `redcap_external_modules_log_parameters`, `redcap_external_links*` | ❌ MVP | Not building EM compatibility — plugin API in Phase 4+. |
| 21 | EHR / FHIR | `redcap_ehr_*` (10 tables) | ❌ MVP | Phase 5. |
| 22 | MyCap (mobile) | `redcap_mycap_*` (12 tables), `redcap_mobile_app_*` | ❌ MVP | Phase 5. |
| 23 | Notifications & messaging | `redcap_messages`, `redcap_messages_recipients`, `redcap_messages_status`, `redcap_messages_threads`, `redcap_email_users_messages`, `redcap_email_users_queries`, `redcap_outgoing_email_sms_log`, `redcap_outgoing_email_sms_identifiers`, `redcap_outgoing_email_counts` | Phase 2 | |
| 24 | Cron / background jobs | `redcap_crons`, `redcap_crons_datediff`, `redcap_crons_history`, `redcap_queue` | ✅ (replaced) | Use a job runner (e.g. `pg-boss` / `BullMQ`) — do not port table semantics. |
| 25 | Alerts | `redcap_alerts`, `redcap_alerts_recurrence`, `redcap_alerts_sent`, `redcap_alerts_sent_log`, `redcap_actions` | Phase 2 | |
| 26 | Caching | `redcap_cache`, `redcap_cde_cache`, `redcap_web_service_cache`, `redcap_dashboard_ip_location_cache`, `redcap_history_size`, `redcap_history_version` | ❌ | Replace with Redis / Next.js cache. |
| 27 | Multilanguage | `redcap_multilanguage_*` (8 tables) | Phase 3 | i18n at app layer + per-project content. |
| 28 | Send-It | `redcap_sendit_docs`, `redcap_sendit_recipients` | ❌ | Out of scope. |
| 29 | Twilio | `redcap_twilio_credentials_temp`, `redcap_twilio_error_log` | ❌ MVP | Adapter in Phase 4. |
| 30 | Rewards | `redcap_rewards_*` (11 tables) | ❌ | Out of scope. |
| 31 | Randomization | `redcap_randomization`, `redcap_randomization_allocation` | Phase 3 | |
| 32 | DDP (dynamic data pull) | `redcap_ddp_*` (8 tables) | ❌ | Out of scope. |
| 33 | Pub matching | `redcap_pub_*` (5 tables) | ❌ | Out of scope. |
| 34 | Form display logic | `redcap_form_display_logic_conditions`, `redcap_form_display_logic_targets`, `redcap_descriptive_popups` | ✅ partial | Branching logic = first-class. |
| 35 | Locking | `redcap_locking_data`, `redcap_locking_labels`, `redcap_locking_records`, `redcap_locking_records_pdf_archive` | Phase 2 | Record lock + e-sign. |
| 36 | CDE (common data elements) | `redcap_cde_field_mapping` | ❌ | Out of scope. |
| 37 | AI log | `redcap_ai_log`, `redcap_reports_ai_prompts` | Phase 4 | |
| 38 | Custom queries | `redcap_custom_queries`, `redcap_custom_queries_folders`, `redcap_custom_queries_folders_items`, `redcap_data_dictionaries`, `redcap_data_import`, `redcap_data_import_rows` | Phase 3 | |
| 39 | Misc / housekeeping | `redcap_todo_list`, `redcap_history_*`, `redcap_library_map`, `redcap_sessions`, `redcap_outgoing_email_counts` | ❌ | Replace with framework primitives. |

**Tables that should NOT be copied directly:** all `*_cache`, all `*_temp` (replaced by transactions/drafts), `redcap_sessions` (Auth.js), `redcap_page_hits` (use analytics tooling), all sharded `redcap_data2..6` and `redcap_log_event2..12` (replaced by partitions), `redcap_history_size`/`_version`, `redcap_queue`/`redcap_crons*` (replaced by job runner), `redcap_pub_*`, `redcap_rewards_*`, `redcap_sendit_*`, `redcap_dashboard_ip_location_cache`.

---

## C. Modern Domain Architecture (Modules)

Each module = own folder in `apps/web/features/<module>` and matching service in `apps/web/server/<module>`. Cross-module data access goes through services, never directly through Prisma in features.

| Module | Purpose | Main entities | Key services | Legacy tables | Priority |
|--------|---------|---------------|--------------|---------------|----------|
| **identity** | Auth, sessions, 2FA, API tokens | `User`, `Account`, `Session`, `ApiToken`, `VerificationToken` | `auth.config.ts`, `tokenService` | `redcap_user_information`, `redcap_auth`, `redcap_two_factor_response`, `redcap_sessions`, `redcap_user_allowlist` | MVP |
| **organizations** | Multi-tenant workspace (new concept; REDCap is single-tenant) | `Organization`, `OrgMember` | `orgService` | n/a (new) | MVP |
| **projects** | Project lifecycle, settings, ownership | `Project`, `ProjectSetting`, `ProjectFolder` | `projectService` | `redcap_projects`, `redcap_folders*`, `redcap_project_checklist` | MVP |
| **forms** | Instrument definitions | `Form` | `formService` | `redcap_forms`, `redcap_instrument_zip*` | MVP |
| **fields** | Variable definitions, choices, validation | `Field`, `FieldChoice`, `FieldRevision` | `fieldService`, `metadataPublisher` | `redcap_metadata`, `redcap_metadata_temp`, `redcap_metadata_archive`, `redcap_metadata_prod_revisions`, `redcap_validation_types` | MVP |
| **branching** | Branching logic & form display logic | `BranchingRule`, `CalculatedExpression` | `branchingEvaluator` (compiled Zod-safe expression engine) | `redcap_form_display_logic_*`, branching-logic columns on `redcap_metadata` | MVP |
| **events** | Arms, events, repeating instruments | `Arm`, `Event`, `EventForm`, `RepeatingInstrument` | `eventService` | `redcap_events_arms`, `redcap_events_metadata`, `redcap_events_forms`, `redcap_events_repeat` | MVP |
| **records** | Record CRUD, status, locking | `Record`, `RecordValue`, `RecordLock`, `RecordSignature` | `recordService`, `recordRepository` | `redcap_data*`, `redcap_record_list`, `redcap_locking_*`, `redcap_esignatures` | MVP |
| **survey-engine** | Public survey runtime | `Survey`, `SurveyTheme` | `surveyRuntime` | `redcap_surveys`, `redcap_surveys_themes`, `redcap_surveys_short_codes` | MVP |
| **participants** | Survey participant management | `Participant`, `ParticipantInvite` | `participantService` | `redcap_surveys_participants`, `redcap_surveys_phone_codes`, `redcap_surveys_login` | MVP |
| **invitations** | Invitations, queues, scheduler | `Invitation`, `Schedule`, `Job` | `invitationService`, `scheduler` | `redcap_surveys_emails*`, `redcap_surveys_queue*`, `redcap_surveys_scheduler*`, `redcap_alerts*` | Phase 2 |
| **responses** | Captured survey responses | `SurveyResponse` | `responseService` | `redcap_surveys_response`, `redcap_surveys_pdf_archive` | MVP |
| **rbac** | Roles + permissions + DAG | `Role`, `Membership`, `Permission`, `DataAccessGroup`, `DagMember` | `permissionService`, `can()` | `redcap_user_roles`, `redcap_user_rights`, `redcap_data_access_groups*` | MVP |
| **audit** | Append-only audit log | `AuditLog` | `auditLogger` | `redcap_log_event*`, `redcap_log_view*` | MVP |
| **reports** | Report definitions & runs | `Report`, `ReportField`, `ReportFilter`, `ReportAccess` | `reportRunner` | `redcap_reports*`, `redcap_project_dashboards*` | MVP (basic) |
| **data-quality** | Rules + status + resolutions | `DqRule`, `DqStatus`, `DqResolution` | `dqEngine` | `redcap_data_quality_*` | Phase 3 |
| **files** | Object storage + bindings | `FileObject`, `FileBinding` | `fileService` (S3/R2) | `redcap_edocs_*`, `redcap_docs*`, `redcap_pdf_*` | MVP (subset) |
| **e-consent** | Consent forms + signatures | `Consent`, `ConsentSignature` | `consentService` | `redcap_econsent*`, `redcap_esignatures` | Phase 3 |
| **jobs** | Background jobs | `JobRun` (or external `pg-boss`) | `queue` | `redcap_crons*`, `redcap_queue` | MVP (skeleton) |
| **integrations** | Webhooks, external API, EHR | `Webhook`, `WebhookDelivery`, `EhrConnection` | `webhookService` | `redcap_external_modules*`, `redcap_ehr_*` | Phase 4+ |
| **admin** | System config, allowlists | `SystemSetting`, `Allowlist` | `adminService` | `redcap_config`, `redcap_user_allowlist`, `redcap_ip_banned` | MVP partial |

API boundaries: every cross-module operation is a server action (`'use server'`) or `app/api/*/route.ts` handler taking a Zod-validated input and returning a typed result. No Prisma client imports in `app/` or `components/`.

---

## D. MVP Scope

### In scope (v1)

For each: **User story → models → routes → screens → validation → tests**.

#### D1. Sign in / sign up (Auth.js)
- *Story:* As a researcher I sign in with email/password (or magic link) and 2FA optional.
- *Models:* `User`, `Account`, `Session`, `VerificationToken`.
- *Routes:* `POST /api/auth/[...nextauth]`, `app/(auth)/sign-in`, `app/(auth)/sign-up`, `app/(auth)/verify`.
- *Screens:* sign-in, sign-up, verify-email, forgot-password, reset-password (REQUIRED — see standards).
- *Validation:* `signInSchema`, `signUpSchema` (zod: email, min-12 password, optional name).
- *Tests:* register → email verify → login; bad-credential lockout after N tries.

#### D2. Organization & membership
- *Story:* On first login a user creates or joins an Organization (workspace).
- *Models:* `Organization`, `OrgMember(role=OWNER|ADMIN|MEMBER)`.
- *Routes:* `createOrganization`, `inviteOrgMember`, `acceptOrgInvite` server actions.
- *Screens:* `app/(app)/orgs/new`, `app/(app)/orgs/[orgId]/members`.
- *Validation:* `orgSchema` (name, slug, country).
- *Tests:* slug uniqueness, only OWNER can delete org.

#### D3. Project creation
- *Story:* Org admin creates a project with title, purpose, longitudinal y/n.
- *Models:* `Project`, `ProjectSetting`.
- *Routes:* `createProject`, `updateProjectSettings`.
- *Screens:* `app/(app)/orgs/[orgId]/projects`, `…/projects/[id]/setup`.
- *Validation:* `projectSchema` (title 1–255, purpose enum, longitudinal bool, dataResolutionWorkflow bool).
- *Tests:* org admin can create; non-member cannot.

#### D4. Form / instrument builder
- *Story:* Designer creates instruments and reorders them.
- *Models:* `Form`, `FormOrder` (just `position` int on Form).
- *Routes:* `createForm`, `renameForm`, `reorderForms`, `deleteForm`.
- *Screens:* `…/projects/[id]/design/forms`.
- *Validation:* `formSchema` (name `^[a-z][a-z0-9_]{0,63}$`, label ≤255).
- *Tests:* unique form name per project; protect last form.

#### D5. Field builder + metadata
- *Story:* Designer adds typed fields to a form (text, number, date, radio, checkbox, dropdown, yes/no, true/false, file, descriptive, calc, slider, signature, section header, notes, time, datetime).
- *Models:* `Field`, `FieldChoice`, `FieldRevision`.
- *Routes:* `createField`, `updateField`, `reorderFields`, `publishMetadata` (creates `FieldRevision` snapshot per project).
- *Screens:* `…/design/forms/[formId]`, drawer editor per field.
- *Validation:* `fieldSchema` discriminated union by `type` (see Section H + I).
- *Tests:* variable-name regex, unique within project, choices required for radio/dropdown/checkbox, `calc` requires expression that parses.

#### D6. Branching logic
- *Story:* Designer specifies "show field X if `[age] >= 18`".
- *Models:* `BranchingRule (fieldId, expression, kind=BRANCH|CALC)`.
- *Routes:* inline on field editor.
- *Validation:* expression parsed by safe evaluator; references existing variables only.
- *Tests:* parser rejects unknown identifiers; cycle detection on calc graph.

#### D7. Records (data entry)
- *Story:* Data entry user opens a record, fills a form, saves.
- *Models:* `Record`, `RecordValue`.
- *Routes:* `createRecord`, `getRecord`, `saveRecordValues`.
- *Screens:* `…/records`, `…/records/[recordId]/[formId]`.
- *Validation:* per-field zod resolved at save from current `FieldRevision`.
- *Tests:* required-field enforcement; branching hides required => not required.

#### D8. Survey (one-instrument)
- *Story:* Designer flips an instrument to "survey-enabled"; gets a public link.
- *Models:* `Survey (formId, theme, openText, closeText, isOpen)`.
- *Routes:* `enableSurvey`, `getPublicSurvey(slug)`, `submitSurveyResponse`.
- *Screens:* `…/design/forms/[formId]/survey`, public `app/(public)/s/[slug]/[hash]`.
- *Validation:* `surveyResponseSchema` derived from Field metadata.
- *Tests:* anonymous submit creates Record + RecordValue + SurveyResponse.

#### D9. Participants & invitations (manual)
- *Story:* Designer pastes emails → app creates Participant + invitation link.
- *Models:* `Participant`, `Invitation`.
- *Routes:* `addParticipants`, `regenerateLink`, `markInviteUsed`.
- *Screens:* `…/survey/participants`.
- *Tests:* one-time link consumes correctly.

#### D10. Roles, memberships, DAGs
- *Story:* Project owner defines roles (Designer/Data Entry/Viewer), assigns users, optionally to a DAG.
- *Models:* `Role`, `Membership`, `DataAccessGroup`, `DagMember`.
- *Routes:* `createRole`, `assignMembership`, `createDag`, `assignDag`.
- *Screens:* `…/users`, `…/users/dags`.
- *Tests:* DAG-restricted user cannot read other DAGs' records.

#### D11. Basic export (CSV)
- *Story:* User exports current records to CSV (respecting DAG + field-level rights).
- *Routes:* `app/api/projects/[id]/export/csv`.
- *Tests:* DAG filter applied; identifier fields stripped if user lacks `EXPORT_PHI`.

#### D12. Audit log
- *Story:* Every create/update/delete/login is recorded.
- *Models:* `AuditLog` (partitioned by month).
- *Routes:* read-only `…/audit`.
- *Tests:* every server action emits an audit event of expected type.

#### D13. Basic report
- *Story:* User defines a list of fields + filters and runs the report.
- *Models:* `Report`, `ReportField`, `ReportFilter`.
- *Tests:* filter on event + DAG returns correct subset.

### Out of MVP (explicitly excluded)
External Module compatibility, MyCap mobile sync, EHR/FHIR import/pull, randomization, advanced e-consent flows, full data-quality engine, cron compatibility with REDCap-format crons, full REDCap REST API parity, multilingual UI per-project, Send-It file sharing, rewards, AI summarisation, DDP, pub matching, Twilio voice/SMS surveys.

---

## E. Recommended Repository Structure

```
/apps
  /web                              # Next.js App Router (the only deployed app)
    /app
      /(auth)/sign-in/page.tsx
      /(auth)/sign-up/page.tsx
      /(auth)/reset-password/page.tsx
      /(app)/orgs/[orgId]/page.tsx
      /(app)/orgs/[orgId]/projects/[projectId]/...
      /(public)/s/[slug]/[hash]/page.tsx        # public survey
      /api/auth/[...nextauth]/route.ts
      /api/projects/[id]/export/csv/route.ts
      layout.tsx
    /components                     # presentational only, no DB
    /features                       # feature folders combining UI + actions
      /projects/components
      /projects/actions.ts          # 'use server'
      /forms/...
      /records/...
    /server                         # server-only services (never imported by client)
      /identity
      /projects
      /records
      /audit
      /rbac
      /survey
      /jobs
      di.ts                         # service locator / context
    /lib
      env.ts                        # zod-validated process.env
      paths.ts                      # typed link builder
    /styles
    middleware.ts                   # auth + rate limit

/packages
  /database                         # @repo/db
    prisma/schema.prisma
    prisma/migrations/
    src/client.ts                   # singleton PrismaClient
    src/repositories/recordRepository.ts
    src/repositories/auditRepository.ts
    seed.ts
  /auth                             # @repo/auth — Auth.js config, providers, callbacks
    src/index.ts
    src/permissions.ts              # can(user, action, resource)
  /ui                               # @repo/ui — shadcn-derived components
  /validation                       # @repo/validation — zod schemas (single source of truth)
    src/field.ts
    src/project.ts
    src/record.ts
  /types                            # @repo/types — shared TS types/enums (Permission, FieldType...)
  /config                           # @repo/config — runtime config + feature flags
  /logger                           # @repo/logger — pino logger + request context
  /test-utils                       # @repo/test-utils — Vitest helpers, fixtures, prismaMock
```

**What goes where:**
- `app/` — only routing, layouts, server actions delegating to `server/*`.
- `components/` — pure UI, no DB/auth imports. Tailwind only via design tokens.
- `features/` — feature-grouped UI + server actions; can import from `server/*` and `@repo/validation`.
- `server/` — business logic; the only place that imports from `@repo/db`.
- `packages/database` — Prisma schema, migrations, repositories, seed.
- `packages/auth` — Auth.js options + permission helpers.
- `packages/validation` — zod schemas reused by client + server.
- `packages/ui` — UI kit; never imports from `server/*` or `@repo/db`.

---

## F. Prisma Schema Draft (MVP)

The full schema is in the companion file **`redcap_modern_schema.prisma`** (see artifact). Selected highlights below. Postgres assumed (declarative partitioning + JSONB + GIN). All models use `@id` cuid + `legacyId Int? @unique` for migration traceability.

Core models (MVP set):
`User`, `Account`, `Session`, `VerificationToken`, `ApiToken`,
`Organization`, `OrgMember`,
`Project`, `ProjectSetting`,
`Form`, `Field`, `FieldChoice`, `FieldRevision`, `BranchingRule`,
`Arm`, `Event`, `EventForm`, `RepeatingInstrument`,
`Record`, `RecordValue`, `RecordLock`, `RecordSignature`,
`Survey`, `Participant`, `Invitation`, `SurveyResponse`,
`Role`, `Membership`, `DataAccessGroup`, `DagMember`,
`Report`, `ReportField`, `ReportFilter`, `ReportAccess`,
`FileObject`, `FileBinding`,
`AuditLog`, `SystemSetting`.

Phase 2+ models (later): `DqRule`, `DqStatus`, `DqResolution`, `Consent`, `ConsentSignature`, `Webhook`, `WebhookDelivery`, `JobRun`, `Alert`, `EhrConnection`, `Randomization`, `RandomizationAssignment`, `Allowlist`, `IpBan`.

---

## G. Legacy → Modern Table Mapping (MVP-relevant)

| Legacy table | Modern model | Notes |
|---|---|---|
| `redcap_user_information` | `User` (+ `ApiToken` for `api_token`) | Drop legacy 2FA columns (Auth.js handles). Keep `legacyId = ui_id`. |
| `redcap_auth` | merged into `User` + Auth.js `Account` | Password hash → `Account.providerType='credentials'`. |
| `redcap_auth_history`, `redcap_auth_questions` | dropped | Replaced by Auth.js. |
| `redcap_two_factor_response` | dropped | Auth.js TOTP. |
| `redcap_sessions` | dropped | Auth.js `Session`. |
| `redcap_user_allowlist`, `redcap_ip_banned`, `redcap_ip_cache` | `Allowlist`, `IpBan` (Phase 2) | |
| `redcap_projects` | `Project` (+ `ProjectSetting` for the long tail of columns) | Hub table; preserve `project_id` as `legacyId`. |
| `redcap_projects_external`, `_templates`, `_user_hidden`, `redcap_project_checklist` | `ProjectSetting` JSONB / `ProjectTemplate` (Phase 2) | |
| `redcap_folders`, `redcap_folders_projects` | `ProjectFolder`, `ProjectFolderItem` | |
| `redcap_metadata` | `Field` (+ `FieldChoice`) | Production = current Field row. |
| `redcap_metadata_temp` | `Field.draft = true` flag, OR `FieldDraft` shadow row | Resolve via "publish metadata" action. |
| `redcap_metadata_archive` | `FieldRevision` snapshots | One revision per publish. |
| `redcap_metadata_prod_revisions` | `FieldRevision` | Same model. |
| `redcap_validation_types` | enum `ValidationType` + table seeded | |
| `redcap_forms`, `redcap_forms_temp` | `Form` (+ draft flag) | |
| `redcap_instrument_zip*` | `FormTemplate` (Phase 2) | |
| `redcap_events_arms` | `Arm` | |
| `redcap_events_metadata` | `Event` | |
| `redcap_events_forms` | `EventForm` (M:N Event↔Form) | |
| `redcap_events_repeat` | `RepeatingInstrument` | Repeat at event level OR instrument level. |
| `redcap_events_calendar`, `_calendar_feed` | `CalendarEntry` (Phase 2) | |
| `redcap_data`, `redcap_data2..6` | **single** `RecordValue` | Partitioned by `projectId` (Postgres). Composite unique `(projectId, recordId, eventId, fieldKey, instance)`. |
| `redcap_record_list`, `redcap_record_counts`, `redcap_record_dashboards`, `redcap_new_record_cache` | `Record` row + materialized view `record_summary_mv` | Caches replaced by SQL views/Redis. |
| `redcap_record_background_delete*` | `Job` table + soft delete on `Record` | |
| `redcap_locking_data`, `_records`, `_labels` | `RecordLock` (level=FORM\|RECORD), `LockingLabel` (Phase 2) | |
| `redcap_locking_records_pdf_archive` | `FileObject` linked to `RecordLock` | |
| `redcap_esignatures` | `RecordSignature` | |
| `redcap_surveys` | `Survey` | |
| `redcap_surveys_themes` | `SurveyTheme` (catalog) | |
| `redcap_surveys_short_codes` | `Survey.shortCode` column | |
| `redcap_surveys_participants` | `Participant` | |
| `redcap_surveys_response` | `SurveyResponse` | Joins to `Record`. |
| `redcap_surveys_pdf_archive` | `FileObject` linked to `SurveyResponse` | |
| `redcap_surveys_login`, `redcap_surveys_phone_codes` | `ParticipantAuth` (Phase 2) | |
| `redcap_surveys_emails*`, `redcap_surveys_queue*`, `redcap_surveys_scheduler*` | `Invitation` + `Schedule` + `JobRun` | Phase 2; runtime via job queue. |
| `redcap_alerts*`, `redcap_actions` | `Alert`, `AlertRecurrence`, `AlertDelivery` (Phase 2) | |
| `redcap_user_roles` | `Role` (template per project) | |
| `redcap_user_rights` | `Membership` (+ `Permission[]`) | Convert per-flag bool columns to a typed `Permission` enum set. |
| `redcap_data_access_groups` | `DataAccessGroup` | |
| `redcap_data_access_groups_users` | `DagMember` | |
| `redcap_reports` | `Report` | |
| `redcap_reports_fields` | `ReportField` | |
| `redcap_reports_filter_*` | `ReportFilter` (typed by `kind`) | |
| `redcap_reports_access_*`, `_edit_access_*` | `ReportAccess` (poly: user/role/dag, view/edit) | |
| `redcap_reports_folders*`, `redcap_project_dashboards*`, `redcap_record_dashboards` | `Report.kind` enum + `ReportFolder` (Phase 3) | |
| `redcap_reports_ai_prompts` | Phase 4 | |
| `redcap_log_event`, `redcap_log_event2..12` | **single** `AuditLog` partitioned monthly | Schema below. |
| `redcap_log_view`, `_old`, `_requests`, `redcap_page_hits` | external observability (OpenTelemetry / Plausible) | |
| `redcap_edocs_metadata`, `redcap_edocs_data_mapping` | `FileObject` + `FileBinding` (target=record-field) | |
| `redcap_docs`, `redcap_docs_attachments`, `redcap_docs_folders*`, `redcap_docs_share`, `redcap_docs_to_edocs` | `ProjectFolder` + `FileObject` + `FileBinding` (target=project) | |
| `redcap_pdf_*` | `FileObject` | Generated artefacts; not first-class models. |
| `redcap_econsent`, `redcap_econsent_forms` | `Consent`, `ConsentVersion` (Phase 3) | |
| `redcap_external_modules*`, `redcap_external_links*` | not migrated; future `Plugin` | |
| `redcap_data_quality_*` | `DqRule`, `DqStatus`, `DqResolution` (Phase 3) | |
| `redcap_messages*` | `Message`, `MessageThread` (Phase 2) | |
| `redcap_outgoing_email_*`, `redcap_email_users_*` | `EmailLog` + provider integration (Phase 2) | |
| `redcap_crons*`, `redcap_queue` | external job runner (`pg-boss`/`BullMQ`) — `JobRun` mirror | |
| `redcap_cache`, `redcap_cde_cache`, `redcap_web_service_cache`, `redcap_dashboard_ip_location_cache`, `redcap_history_size`, `redcap_history_version` | not migrated; Redis or built-in Next.js cache | |
| `redcap_form_display_logic_*`, `redcap_descriptive_popups` | `BranchingRule` (kind=DISPLAY) | |
| `redcap_multilanguage_*` | `Translation` (Phase 3) | |
| `redcap_mobile_app_*`, `redcap_mycap_*`, `redcap_ehr_*`, `redcap_ddp_*`, `redcap_pub_*`, `redcap_rewards_*`, `redcap_sendit_*`, `redcap_twilio_*` | not migrated MVP | |
| `redcap_randomization*` | `Randomization`, `RandomizationAssignment` (Phase 3) | |
| `redcap_data_dictionaries`, `redcap_data_import*`, `redcap_custom_queries*`, `redcap_cde_field_mapping` | `DataDictionary`, `Import`, `ImportRow` (Phase 3) | |
| `redcap_config` | `SystemSetting` (kv) | |

---

## H. API & Service Layer Design

Pattern (every domain): `server/<domain>/{service.ts, repository.ts, dto.ts}` + Zod schema in `@repo/validation` + server action in `features/<domain>/actions.ts`.

Standard server-action shape:

```ts
'use server';
import { z } from 'zod';
import { authedAction } from '@/server/safe-action';
import { projectService } from '@/server/projects/service';
import { createProjectSchema } from '@repo/validation/project';

export const createProject = authedAction
  .input(createProjectSchema)
  .require(({ user, input }) => ({ orgId: input.orgId, perm: 'PROJECT_CREATE' }))
  .handler(async ({ user, input }) => projectService.create(user, input));
```

Selected route catalog (MVP):

| Action / route | Input | Output | Permission | Models touched | Audit event | Error cases |
|---|---|---|---|---|---|---|
| `auth/sign-up` | `{email,password,name}` | session | public | User, Account | `USER_REGISTERED` | dup email, weak pwd |
| `auth/sign-in` | `{email,password,otp?}` | session | public | Session | `USER_LOGIN` / `USER_LOGIN_FAILED` | bad creds, locked |
| `org/create` | `{name,slug}` | Org | authed | Org, OrgMember | `ORG_CREATED` | slug taken |
| `project/create` | `{orgId,title,purpose,longitudinal}` | Project | `ORG.PROJECT_CREATE` | Project, ProjectSetting, Role(default×3), Membership | `PROJECT_CREATED` | quota |
| `form/create` | `{projectId,name,label}` | Form | `PROJECT.DESIGN` | Form | `FORM_CREATED` | dup name |
| `field/create` | discriminated `FieldInput` | Field | `PROJECT.DESIGN` | Field, FieldChoice | `FIELD_CREATED` | invalid name, bad choices |
| `metadata/publish` | `{projectId}` | RevisionId | `PROJECT.DESIGN_PUBLISH` | FieldRevision (snapshot) | `METADATA_PUBLISHED` | draft empty |
| `record/save` | `{projectId,recordId?,eventId?,instance?,values:[{fieldKey,value}]}` | Record | `PROJECT.DATA_ENTRY` (+ DAG match) | Record, RecordValue, AuditLog | `RECORD_VALUE_SET` per field | branching-required violations |
| `record/lock` | `{recordId,formId,eventId,instance,signature?}` | RecordLock | `PROJECT.LOCK` | RecordLock, RecordSignature | `RECORD_LOCKED` | already locked |
| `survey/enable` | `{formId, theme}` | Survey | `PROJECT.DESIGN` | Survey | `SURVEY_ENABLED` | form has 0 fields |
| `survey/submit` | `{slug,hash,values}` | ack | public | Record, RecordValue, SurveyResponse | `SURVEY_SUBMITTED` | hash invalid/used |
| `participant/add` | `{surveyId, emails[]}` | Participant[] | `PROJECT.SURVEY_MANAGE` | Participant, Invitation | `PARTICIPANT_ADDED` | dup, bad email |
| `report/run` | `{reportId,page,size}` | RecordValue rows | `PROJECT.REPORT_VIEW` (+ DAG + field rights) | Report, RecordValue | `REPORT_RAN` | invalid filter |
| `export/csv` | `{projectId,reportId?}` | CSV stream | `PROJECT.EXPORT` (+ `EXPORT_PHI`) | RecordValue | `RECORDS_EXPORTED` | size cap |
| `dag/assign` | `{projectId,userId,dagId}` | Membership | `PROJECT.USER_MANAGE` | DagMember | `DAG_ASSIGNED` | not project member |
| `audit/list` | `{projectId, filters}` | AuditLog[] | `PROJECT.AUDIT_VIEW` | AuditLog | – | – |

Vitest test cases for each: happy path, permission denied, validation failure, idempotency (where relevant), audit event emitted.

---

## I. Auth & Permission Model

### Roles (built-in, can be cloned per project)
- `SYSTEM_ADMIN` (system-wide; `User.isSystemAdmin`)
- `ORG_OWNER`, `ORG_ADMIN`, `ORG_MEMBER` (`OrgMember.role`)
- Project roles (rows in `Role`, default seed):
  - `PROJECT_OWNER` — all permissions in project.
  - `PROJECT_DESIGNER` — design/publish, no PHI export.
  - `DATA_ENTRY` — read+write records in scope (DAG-bounded).
  - `DATA_VIEWER` — read-only (DAG-bounded), no export.
  - `SURVEY_MANAGER` — manage participants, view responses.
  - `REPORT_VIEWER` — list and run reports.

### Permissions (enum, granted to `Membership`)
```ts
type Permission =
  | 'PROJECT.DESIGN' | 'PROJECT.DESIGN_PUBLISH'
  | 'PROJECT.DATA_ENTRY' | 'PROJECT.DATA_VIEW'
  | 'PROJECT.LOCK' | 'PROJECT.E_SIGN'
  | 'PROJECT.SURVEY_MANAGE' | 'PROJECT.SURVEY_RESPONSE_VIEW'
  | 'PROJECT.REPORT_VIEW' | 'PROJECT.REPORT_EDIT'
  | 'PROJECT.EXPORT' | 'PROJECT.EXPORT_PHI'
  | 'PROJECT.USER_MANAGE' | 'PROJECT.DAG_MANAGE'
  | 'PROJECT.AUDIT_VIEW' | 'PROJECT.SETTINGS';
```

### `can()` helper

```ts
// packages/auth/src/permissions.ts
export async function can(
  user: SessionUser,
  perm: Permission,
  scope: { projectId: string; recordId?: string; fieldKey?: string },
): Promise<boolean> {
  if (user.isSystemAdmin) return true;
  const m = await db.membership.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: scope.projectId } },
    include: { role: true, dag: true },
  });
  if (!m || !m.role.permissions.includes(perm)) return false;

  // ABAC: DAG isolation
  if (m.dagId && scope.recordId) {
    const r = await db.record.findUnique({ where: { id: scope.recordId } });
    if (!r || r.dagId !== m.dagId) return false;
  }
  // Field-level: identifiers require EXPORT_PHI for export ops
  if (perm === 'PROJECT.EXPORT' && scope.fieldKey) {
    const f = await db.field.findUnique({ where: { projectId_key: { projectId: scope.projectId, key: scope.fieldKey } } });
    if (f?.isPhi && !m.role.permissions.includes('PROJECT.EXPORT_PHI')) return false;
  }
  return true;
}

export async function assertCan(...args: Parameters<typeof can>) {
  if (!(await can(...args))) throw new ForbiddenError(args[1]);
}
```

### Tests for permission boundaries
- DAG-restricted user reading another DAG's record → 403.
- Designer without `EXPORT_PHI` exporting CSV → identifier columns null + audit event `EXPORT_PHI_REDACTED`.
- Locked record + non-owner attempts edit → 403, no audit "RECORD_VALUE_SET".
- Public survey submit succeeds without session.
- `SYSTEM_ADMIN` always passes.

---

## J. Form Builder & Metadata Model

### Field types and Prisma representation

```prisma
enum FieldType {
  TEXT NOTES NUMBER INTEGER DATE TIME DATETIME
  RADIO CHECKBOX DROPDOWN YESNO TRUEFALSE
  FILE DESCRIPTIVE CALC SLIDER SIGNATURE SECTION_HEADER
}
```

| Type | Storage column on `RecordValue` | Zod (per FieldRevision) | React component |
|---|---|---|---|
| TEXT/NOTES | `valueText` | `z.string().max(field.maxLen)` + validation type | `<TextInput>`/`<Textarea>` |
| NUMBER/INTEGER | `valueNumber` | `z.coerce.number()` + min/max | `<NumberInput>` |
| DATE/TIME/DATETIME | `valueDate` | `z.coerce.date()` | `<DateInput>` |
| RADIO/DROPDOWN/YESNO/TRUEFALSE | `valueText` (choice code) | `z.enum([...choiceCodes])` | `<Radio>`/`<Select>` |
| CHECKBOX | `valueJson` (array of codes) — also exploded into per-choice rows for export parity | `z.array(z.enum([...]))` | `<CheckboxGroup>` |
| FILE | `valueFileId` (FK FileObject) | `z.string().cuid()` | `<FileUpload>` |
| DESCRIPTIVE / SECTION_HEADER | none | none | render-only |
| CALC | `valueNumber` (computed server-side) | derived | read-only display |
| SLIDER | `valueNumber` | min/max/step | `<Slider>` |
| SIGNATURE | `valueFileId` (PNG) + `RecordSignature` | base64→FileObject | `<SignaturePad>` |

### Field model

```prisma
model Field {
  id           String   @id @default(cuid())
  legacyId     Int?     @unique
  projectId    String
  formId       String
  key          String   // variable name [a-z_][a-z0-9_]*
  label        String
  type         FieldType
  validation   ValidationType?
  minValue     String?
  maxValue     String?
  isRequired   Boolean  @default(false)
  isIdentifier Boolean  @default(false)   // PHI flag
  isPhi        Boolean  @default(false)
  position     Int
  matrixGroup  String?
  matrixHeader String?
  notes        String?
  fieldNote    String?
  customAlign  String?
  questionNum  String?
  draft        Boolean  @default(false)   // replaces metadata_temp split

  choices      FieldChoice[]
  branching    BranchingRule[]
  project      Project  @relation(fields: [projectId], references: [id])
  form         Form     @relation(fields: [formId], references: [id])

  @@unique([projectId, key])
  @@index([projectId, formId, position])
}

model FieldChoice {
  id       String @id @default(cuid())
  fieldId  String
  code     String
  label    String
  position Int
  field    Field  @relation(fields: [fieldId], references: [id], onDelete: Cascade)
  @@unique([fieldId, code])
}

model FieldRevision {
  id         String   @id @default(cuid())
  projectId  String
  publishedAt DateTime @default(now())
  publishedBy String
  snapshot   Json     // full Field+Choice array at publish time
  @@index([projectId, publishedAt])
}
```

### Branching / Calc

`BranchingRule.expression` is parsed with a safe AST evaluator (pegjs/chevrotain) — no `eval`. Allowed identifiers are `Field.key`s in the project. Calc expressions form a DAG (cycle-checked at publish).

### Matrix / repeating instruments

- Matrix groups: `Field.matrixGroup` + `matrixHeader` — render-only grouping; no data shape change.
- Repeating instruments: handled by `RepeatingInstrument` (level=`EVENT`|`INSTRUMENT`) and the `instance` int on `RecordValue`.

---

## J2. Record & Survey Storage Strategy

### Options compared

| Option | Query perf | Export perf | Audit | Form-change flexibility | Longitudinal | Repeating | Validation | Migration | Prisma fit | DBeaver visibility |
|---|---|---|---|---|---|---|---|---|---|---|
| **Pure EAV** (REDCap-style) | OK with right indexes | Slow (pivot needed) | Good (per-cell rows) | Excellent | Excellent | Excellent | Per-cell | 1:1 trivial | OK | Cells visible but unpivoted |
| **JSONB per response** | Fast read whole doc | Fast | Coarse (whole-doc diffs) | Excellent | Easy | Easy | Per-doc | Lossy (need pivot) | Good | Hard to query without `->>` |
| **Generated relational tables** | Fastest | Fastest | Per-column | Painful (schema migrations on each form change) | Hard | Hard | Easy | Impossible without per-project migrations | Poor (dynamic) | Excellent |
| **Hybrid (recommended)** | Good | Good | Per-cell + per-form | Excellent | Excellent | Excellent | Per-cell + per-form | Direct from `redcap_data` | Good | Both visible |

### Recommendation: Hybrid

- **`RecordValue`** (typed EAV, partitioned by `projectId`) is the **system of record** — preserves REDCap's per-cell auditability and migration parity.
- **`SurveyResponse.payload Jsonb`** caches the submitted form snapshot for fast public-survey display + PDF generation. This is **derived** data; source of truth remains `RecordValue`.
- **Per-project materialized views** (`record_<projectId>_wide`) generated on metadata publish → fast exports/reports. Refreshed by job.

### `RecordValue` model

```prisma
model RecordValue {
  id        BigInt   @id @default(autoincrement())
  projectId String
  recordId  String   // logical record id (string for compatibility with REDCap record ids)
  eventId   String?
  fieldKey  String   // denormalised — Field can be deleted; values keep history
  instance  Int      @default(1)   // for repeating
  valueText   String?
  valueNumber Decimal? @db.Decimal(38, 10)
  valueDate   DateTime?
  valueJson   Json?
  valueFileId String?
  setAt     DateTime @default(now())
  setBy     String?  // userId or null for survey
  source    RecordValueSource  // DATA_ENTRY | SURVEY | IMPORT | API | CALC

  record    Record   @relation(fields: [projectId, recordId], references: [projectId, key])
  @@unique([projectId, recordId, eventId, fieldKey, instance])
  @@index([projectId, fieldKey])
  @@index([projectId, recordId])
}
// Postgres: PARTITION BY HASH (projectId)  — done in migration SQL.
```

### Save flow (record)

1. `assertCan(user, 'PROJECT.DATA_ENTRY', { projectId, recordId })`.
2. Load current `FieldRevision` (or live `Field`s if no revision yet).
3. Build per-form Zod schema, parse incoming `values`.
4. Run branching evaluator → drop hidden fields' values.
5. Run calc engine on dependents → compute derived values.
6. In a single transaction: upsert `Record`, upsert each `RecordValue`, append `AuditLog` rows.
7. Invalidate caches; enqueue `report.refresh` if needed.

### Survey submit flow

1. Validate `(slug, hash)` → `Participant` + `Survey` + `Form`.
2. Build Zod schema from current published metadata.
3. If anonymous + first submit: create `Record` with generated id.
4. Upsert `RecordValue` rows (`source=SURVEY`).
5. Insert `SurveyResponse(participantId, recordId, payload, submittedAt)`.
6. Mark `Invitation.usedAt`.
7. Audit event `SURVEY_SUBMITTED`.

### Audit log

```prisma
model AuditLog {
  id         BigInt   @id @default(autoincrement())
  at         DateTime @default(now())
  actorId    String?
  actorIp    String?
  projectId  String?
  recordId   String?
  fieldKey   String?
  event      AuditEvent
  details    Json?
  legacyId   BigInt?  @unique
  @@index([projectId, at])
  @@index([recordId, at])
  @@index([event, at])
}
// Postgres: PARTITION BY RANGE (at) — monthly partitions managed by pg_partman or migration.
```

### Migration from `redcap_data*`
- Read each shard with a stable cursor (`(project_id, record, event_id, field_name, instance)`).
- Map `field_name → fieldKey`, route `value` into the typed column based on `Field.type`.
- Preserve original timestamps via `setAt = COALESCE(latest log_event ts, now())`.
- For checkbox values (`field_name___code`), reassemble into `valueJson = [codes]`.
- Validate counts per project before cutover; record discrepancies in `MigrationRun`.

---

## K. Phased Migration Roadmap

### Phase 1 — Schema understanding & contract lock
**Scope:** Freeze REDCap schema. Generate machine-readable mapping. Build Prisma schema + seeds. Validate FK integrity.
**Deliverables:** `redcap_modern_schema.prisma`, table-mapping CSV, ER diagram, seeded local DB.
**Risks:** Upgrade scripts mutate schema beyond `install.sql` — mitigate by also folding `redcap_v15.8.4/Resources/sql/upgrades/*` if available.
**Tests:** Vitest schema-shape snapshots; FK count matches `redcap_fk_edges.csv` for migrated tables.
**Rollback:** read-only — none required.

### Phase 2 — Identity, projects, metadata
**Scope:** Migrate `User` (from `redcap_user_information`), `Organization` (synthesised), `Project`, `Form`, `Field` (+ choices), `Arm`, `Event`, `EventForm`, `RepeatingInstrument`, `Role`, `Membership`, `DataAccessGroup`.
**Deliverables:** ETL script `pkgs/database/migrate/phase2.ts` reading source MySQL via read-only DSN.
**Risks:** Password hashes incompatible with Auth.js → require password reset email on first login.
**Tests:** Per-project field count == legacy `metadata` count; role permission matrix snapshot.
**Rollback:** drop new schemas, source untouched.

### Phase 3 — Records & surveys
**Scope:** Migrate `Record`, `RecordValue` (from `redcap_data*`), `Survey`, `Participant`, `SurveyResponse`, file objects.
**Deliverables:** streaming ETL with checkpointing; export-comparison harness against legacy CSV export.
**Risks:** Checkbox reassembly errors, repeating-instance off-by-one, charset issues. Mitigate with row-level diff harness.
**Tests:** Random-sample 1% of records: legacy CSV export ≡ new CSV export (column-by-column).
**Rollback:** truncate value tables; preserve `Record` shells.

### Phase 4 — Permissions & audit
**Scope:** Migrate `redcap_user_rights` flag-set → `Permission[]`, `redcap_log_event*` → `AuditLog`.
**Deliverables:** Permission translator, audit shard merger.
**Risks:** Permission semantic drift (some flags map to combinations).
**Tests:** Boundary tests per role × per action; audit count parity per project.
**Rollback:** revoke memberships; legacy logs preserved.

### Phase 5 — Reports, DQ, files, e-consent
**Scope:** Migrate `Report*`, `DqRule*`, `FileObject` from `edocs_metadata`, e-consent + e-signatures.
**Deliverables:** report runner parity tests.
**Risks:** Report SQL filters interpreted differently; DQ rule expression syntax.
**Tests:** Run identical reports on both systems; row-set equality.
**Rollback:** disable new reports route.

### Phase 6 — Cutover
**Scope:** Shadow-read for N days; dual-write for write paths; reconcile diffs; freeze legacy writes; switch DNS.
**Deliverables:** Reconciliation dashboard, runbook.
**Risks:** Write skew during dual-write window. Mitigate with single-writer flag per project.
**Tests:** End-to-end UAT scripts per persona; export comparison; load test at 2× peak.
**Rollback:** Re-point DNS to legacy; replay buffered writes.

---

## L. Testing Strategy with Vitest

Layered:
1. **Unit** — pure functions (zod schemas, branching evaluator, calc engine, `can()` helper).
2. **Service** — `server/*` services with `prismaMock` (`@repo/test-utils`).
3. **Integration** — real Postgres via testcontainers; full server actions; one DB per worker.
4. **Contract** — public survey + REST: snapshot of response shape per route.
5. **Migration** — fixtures of legacy `redcap_data*` rows → assert produced `RecordValue` set.
6. **E2E** — Playwright (separate `apps/e2e`), happy paths only (sign-up → create project → enter record → export).

Coverage gates: 90% on `server/*`, 95% on `@repo/validation`, 100% on `@repo/auth/permissions`.

Examples (sketch):

```ts
// packages/validation/__tests__/field.spec.ts
import { fieldSchema } from '../src/field';
test('radio requires choices', () => {
  expect(() => fieldSchema.parse({ type: 'RADIO', key: 'sex', label: 'Sex', choices: [] })).toThrow();
});

// server/records/__tests__/save.spec.ts
test('hidden-by-branching field is not required', async () => {
  const ctx = await makeProject({ branching: '[age] >= 18' });
  await expect(saveRecord(ctx, { age: 10 /* requiredAdultField missing */ })).resolves.toBeOk();
});

// packages/auth/__tests__/permissions.spec.ts
test('DAG isolation blocks cross-DAG read', async () => {
  expect(await can(userInDagA, 'PROJECT.DATA_VIEW', { projectId, recordId: recordInDagB })).toBe(false);
});
```

---

## M. Risks & Assumptions

| # | Item | Type | Mitigation |
|---|---|---|---|
| 1 | `install.sql` may not reflect upgrade-applied schema | [ASSUMPTION] | Also fold `Resources/sql/upgrades/*.sql` before freezing contract |
| 2 | Password hashing scheme in `redcap_auth` may not be re-usable by Auth.js | [INFERRED] | Force password reset on first login |
| 3 | Branching/calc expression syntax compatibility | [INFERRED] | Build a translator + golden-test per project; fall back to "needs-review" status |
| 4 | Sharded `redcap_data2..6` partitioning rules | [ASSUMPTION] (project_id-based) | Verify in PHP `Records::getDataTable` before migration |
| 5 | E-signature legal validity across migration | [ASSUMPTION] | Preserve original timestamps + actor + payload hash; do NOT regenerate |
| 6 | Audit log volume can be very large (12 shards exist) | [CONFIRMED] | Postgres declarative partitioning + pg_partman; archive cold partitions to object storage |
| 7 | DAG semantics interact with reports & exports | [CONFIRMED] | Centralise in `can()` and test boundary cases per role |
| 8 | REDCap's "draft mode" semantics complex (metadata + multilanguage temp + forms_temp) | [CONFIRMED] | Single `draft:bool` + `publishMetadata` action; explicit FieldRevision snapshot |
| 9 | External Module DB-changing behavior | [CONFIRMED out of scope] | Don't promise EM compatibility; document plugin API in Phase 4 |
| 10 | PHI / 21 CFR Part 11 compliance scope unclear | [ASSUMPTION] | Assume yes by default: append-only audit, e-sign, locking, retention policy |
| 11 | Multi-tenant `Organization` is a NEW concept | [DESIGN] | Single-org install supported via auto-org-on-bootstrap |
| 12 | Single-instance vs SaaS deployment mode | [ASSUMPTION] | Both supported; flagged via `DEPLOYMENT_MODE` env |

---

## N. Recommended Next Coding Tasks (in order)

1. **Bootstrap monorepo** (pnpm + turbo) — create `apps/web` (Next 14 App Router) + `packages/{database,auth,ui,validation,types,config,logger,test-utils}`.
2. **Add Prisma + Postgres + initial schema** — copy `redcap_modern_schema.prisma`, run `prisma migrate dev`, seed `ValidationType`, default `Role`s.
3. **Wire Auth.js** — Credentials + Email + (optional) Google provider; `User`/`Account`/`Session`/`VerificationToken` tables.
4. **Implement `can()` + `assertCan()` + `authedAction` wrapper** in `@repo/auth`.
5. **Org + Project CRUD** server actions and screens (creates default Roles + owner Membership on project creation).
6. **Form + Field builder** with Zod-discriminated `FieldInput` + `metadata.publish` server action that writes `FieldRevision`.
7. **Branching evaluator + calc engine** as a pure package (`@repo/expression`) with full Vitest coverage.
8. **Record save flow** + `RecordValue` repository with Postgres partition migration.
9. **Survey enable + public submit page** + `SurveyResponse`.
10. **Audit logger** + monthly partitioning migration; emit events from every server action.
11. **DAG + permission boundary tests** (Vitest integration with testcontainers Postgres).
12. **Basic CSV export route** (DAG + PHI redaction).
13. **Migration script skeleton** `packages/database/migrate/phase2.ts` reading legacy MySQL via read-only connection.

---

## Appendix — Confirmed vs Inferred vs Assumption (key items)

- [CONFIRMED] 231 tables, 180 FK edges, sharded data/log tables, `redcap_projects` is the dominant hub (per audit §B/§E).
- [CONFIRMED] Draft/production duality on metadata via `*_temp` siblings.
- [CONFIRMED] REDCap stores 2FA in dedicated table; sessions in dedicated table.
- [INFERRED] Permission semantics in `redcap_user_rights` are bool-flag columns mapped to actions.
- [INFERRED] `redcap_data` partitioning rule is project-id-based across `redcap_data2..6`.
- [ASSUMPTION] `install.sql` represents the production schema for v15.8.4 (audit §J).
- [ASSUMPTION] Password storage is bcrypt-compatible — to be verified before writing migration.

