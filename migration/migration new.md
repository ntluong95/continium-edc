Yes. I would treat **Formbricks as the modern product shell** and **REDCap as the clinical-trial domain logic**, then keep only the minimum Formbricks pieces needed for Continium.

Important: if you directly fork or copy Formbricks code, be careful with licensing. Formbricks core is AGPLv3, and their README says modified versions must also be published under AGPLv3; their Enterprise code lives under `/apps/web/modules/ee` and is separately licensed.

## Recommended direction

Use Formbricks for:

- Modern dashboard UI
- Form/survey builder experience
- Survey rendering UX
- Auth and organization/project structure
- Prisma/PostgreSQL architecture
- Zod validation patterns
- Testing/developer workflow

Use REDCap for:

- Clinical trial/project concepts
- Instruments/CRFs
- Variables/fields
- Longitudinal events and arms
- Repeating instruments
- Participant records
- Data Access Groups
- Audit logs
- Export logic
- E-consent and compliance concepts

Formbricks already uses the stack you want: TypeScript, Next.js, React, TailwindCSS, Prisma, Auth.js, Zod, and Vitest. Its repo is organized as a monorepo with `apps` and `packages`, including `apps/web`, `packages/database`, `packages/survey-ui`, `packages/surveys`, `packages/types`, `packages/storage`, and `packages/logger`.

## Keep this minimum Formbricks core

|Area|Keep?|Why|
|---|---|---|
|`apps/web`|Yes|Main Next.js app shell, dashboard, routing, auth flow|
|`packages/database`|Yes|Prisma/PostgreSQL structure|
|`packages/survey-ui`|Yes|Useful for survey/form rendering|
|`packages/surveys`|Yes, adapt|Useful survey logic, but must become clinical instrument logic|
|`packages/types`|Yes|Shared TypeScript types|
|`packages/logger`|Yes|Useful for audit/debug logging|
|`packages/email`|Maybe|Needed for survey invitations and participant follow-up|
|`packages/storage`|Later|Needed for files, consent PDFs, attachments|
|`packages/cache`|Later|Useful later for performance/rate limiting|
|`apps/storybook`|Optional|Useful only if you want UI component development|
|`/apps/web/modules/ee`|No|Enterprise-licensed area; avoid for Continium|

Formbricks uses PostgreSQL with Prisma as its database stack, and its database docs describe a multi-tenant model around organizations, projects, environments, surveys, contacts, users, memberships, and responses. Their Prisma schema also stores survey configuration in JSON fields such as `questions`, `blocks`, `endings`, `variables`, and styling, while responses are stored with JSON `data`, `variables`, `ttc`, and `meta`.

## Remove or avoid from Formbricks

For Continium, remove or avoid these unless needed later:

- Product-feedback terminology
- Website/app survey targeting
- Action triggers
- Customer segmentation logic
- Slack/Zapier/n8n integrations
- Billing/subscription logic
- Enterprise modules
- Branding/white-label commercial logic
- Product analytics features
- In-app widget SDK, unless you later need embedded clinical surveys

These are useful for a Qualtrics-style product, but not essential for clinical trials or longitudinal studies.

## Adapt Formbricks concepts into Continium concepts

|Formbricks concept|Continium equivalent|
|---|---|
|Organization|Institution / research organization|
|Project|Study / clinical trial project|
|Environment|Draft / production study environment|
|Survey|Instrument / survey instance|
|Question|Field / variable|
|Contact|Participant|
|Response|Record response / survey response|
|Membership|Study team membership|
|Team|Study team or site team|
|Segment|Cohort/filter group, optional later|
|Display / trigger|Not needed for MVP|
|Webhook/integration|Later phase|

## Target Continium MVP architecture

/apps  
  /web  
    /app  
    /components  
    /features  
      /auth  
      /organizations  
      /studies  
      /instruments  
      /fields  
      /participants  
      /records  
      /surveys  
      /events  
      /permissions  
      /audit  
      /exports  
  
/packages  
  /database  
  /auth  
  /ui  
  /types  
  /validation  
  /logger  
  /permissions  
  /clinical-core

The key difference is that Continium should not use Formbricks’ survey model directly as the clinical source of truth. Instead, build a **clinical-core model** around:

Study  
Instrument  
Field  
FieldOption  
BranchingLogic  
Arm  
Event  
EventInstrument  
Participant  
Record  
RecordValue  
Survey  
SurveyResponse  
Role  
Permission  
DataAccessGroup  
AuditLog  
ExportJob  
FileObject  
ConsentDocument

## Database plan

Formbricks’ `Survey.questions JSON` model is flexible and good for fast survey creation. For Continium, I would use a **hybrid model**:

1. Store clinical structure relationally:
    - `Study`
    - `Instrument`
    - `Field`
    - `FieldOption`
    - `Event`
    - `Arm`
    - `Participant`
    - `Record`
    - `RecordValue`
2. Store rendering/config snapshots as JSON:
    - survey display configuration
    - field layout
    - branching preview
    - published instrument version
3. Store responses in a clinical-safe structure:
    - `Record`
    - `RecordValue`
    - `SurveyResponse`
    - `SurveyResponseValue`

This gives you REDCap-style auditability and DBeaver visibility, while still keeping Formbricks-like UI flexibility.

## Authorization plan

Keep the Formbricks idea of `User`, `Organization`, and `Membership`. Their schema has users with email, sessions, accounts, memberships, 2FA fields, active status, and login metadata. Their organization and membership model supports owner/manager/member/billing roles.

But extend it for clinical research:

OrganizationRole:  
- owner  
- admin  
- member  
  
StudyRole:  
- study_owner  
- study_admin  
- designer  
- data_manager  
- data_entry  
- monitor  
- investigator  
- viewer  
  
Permissions:  
- study.read  
- study.update  
- instrument.create  
- instrument.update  
- field.update  
- record.create  
- record.read  
- record.update  
- record.export  
- survey.manage  
- participant.manage  
- audit.read  
  
DataAccessGroup:  
- restricts participant/record visibility by site or cohort

This is where REDCap logic is more important than Formbricks.

## Implementation roadmap

### Phase 0 — Decide legal and repo strategy

Choose one:

**Option A: Clean-room Continium, Formbricks as inspiration only**  
Best if you want freedom over licensing and architecture.

**Option B: Formbricks fork, stripped down**  
Faster UI start, but you must accept AGPL implications and avoid Enterprise code.

My recommendation: **Option A if Continium may become private/commercial; Option B only if AGPL is acceptable.**

### Phase 1 — Create `formbricks-minimal` reference branch

In your local Formbricks source:

- Identify UI shell, auth, survey builder, survey rendering, and database patterns.
- Document useful files.
- Do not start by moving code into Continium.
- Create a `docs/formbricks-patterns.md` file with:
    - adopt
    - adapt
    - ignore
    - avoid

### Phase 2 — Stabilize Continium foundation

Set up:

- Next.js app router
- PostgreSQL
- Prisma
- Auth.js
- TailwindCSS
- Zod
- Vitest
- basic dashboard shell
- organization/project/study navigation

Use Formbricks’ monorepo style, but rename concepts to clinical terms.

### Phase 3 — Build clinical data model

Implement MVP Prisma models:

User  
Organization  
Membership  
Study  
StudyMember  
StudyRole  
Permission  
Instrument  
Field  
FieldOption  
Arm  
Event  
EventInstrument  
Participant  
Record  
RecordValue  
Survey  
SurveyResponse  
SurveyResponseValue  
DataAccessGroup  
AuditLog

Do not copy Formbricks’ schema directly. Use it as a design reference.

### Phase 4 — Build form/instrument builder

Adapt the Formbricks-style builder UX into a REDCap-style instrument builder:

- field list
- drag-and-drop ordering
- variable name
- field label
- field type
- choices/options
- validation
- required flag
- branching logic
- calculated field placeholder
- preview mode
- publish version

### Phase 5 — Build survey runtime

Use Formbricks survey rendering ideas for:

- public survey link
- progress between pages
- validation
- mobile-friendly UI
- submit response
- thank-you page

But Continium response saving should write to clinical models, not just a generic JSON response.

### Phase 6 — Build clinical authorization

Add:

- project/study-level permissions
- instrument-level permissions
- Data Access Groups
- export permissions
- audit visibility permissions

Every server action should check permissions before touching data.

### Phase 7 — Add audit and export

For clinical trial readiness:

- log every record create/update/delete
- log survey submission
- log export
- log permission changes
- CSV export respecting DAG and permissions
- basic audit viewer

## What the “minimum Formbricks-inspired Continium” should support first

MVP:

Login  
Organization  
Study/project  
Study member roles  
Instrument builder  
Field builder  
Participant list  
Record entry  
Survey link  
Survey response capture  
Data Access Groups  
Audit log  
CSV export

Not MVP:

FHIR/EHR  
MyCap  
advanced e-consent  
randomization  
complex report builder  
external modules  
webhooks  
billing  
enterprise SSO  
in-app website widget  
AI analytics

## My recommended engineering rule

Use this rule when deciding whether to keep Formbricks code or redesign:

> Keep Formbricks patterns when the problem is UI, developer experience, routing, validation, auth, or survey rendering.  
> Use REDCap-inspired design when the problem is clinical trial structure, longitudinal data, records, events, permissions, auditability, or exports.

In short: **Formbricks should give Continium its modern skin and engineering style. REDCap should give Continium its clinical research brain.**




Keep these **core areas intact first**:

1. **App shell + auth + tenancy plumbing** in `apps/web`
2. **DB + Prisma infrastructure** in `packages/database`
3. **Shared typing + validation + logging** in `packages/types`, `packages/logger`, selected `lib` utilities
4. **Survey runtime/builder primitives** in `packages/surveys`, `packages/survey-ui`
5. **Only OSS modules in `apps/web/modules`** (exclude `apps/web/modules/ee` entirely)

Then progressively replace product-feedback-specific modules with clinical equivalents.

---

## 1) Folder-level keep/remove map

## Keep (initially)

- `apps/web/app`  
    Keep route structure, layouts, middleware usage patterns, server actions conventions.
- `apps/web/modules` _(selective)_  
    Keep shared UI/UX patterns, form handling, data-table, auth/org/project patterns.
- `apps/web/lib`  
    Keep service/repository/action architecture, cache helpers, permission-check patterns.
- `apps/web/components`  
    Keep generic components only (buttons, dialogs, table, pagination, etc.).
- `packages/database`  
    Keep Prisma client setup, migrations pipeline, seed/dev tooling.
- `packages/types`  
    Keep DTO/domain type organization pattern.
- `packages/surveys`  
    Keep rendering and builder engine foundations; adapt domain terms.
- `packages/survey-ui`  
    Keep reusable survey rendering components.
- `packages/logger`  
    Keep structured logging and audit-friendly logger patterns.
- `config-*` packages  
    Keep lint/tsconfig/prettier setup.
- `turbo.json`, `pnpm-workspace.yaml`, root scripts  
    Keep monorepo/dev productivity baseline.

## Exclude/Avoid immediately

- `apps/web/modules/ee` (entire folder, licensing + scope)
- Billing/subscription/payment-related modules
- Product-led growth integrations (Slack/Zapier/n8n etc.)
- Website/app targeting/action-trigger logic
- In-app widget logic (unless later needed)
- Branding/white-label or enterprise-only feature flags

---

## 2) File/function keep strategy by concern

## A) App shell & routing (`apps/web/app`, `apps/web/modules`, `apps/web/lib`)

**Keep patterns/functions:**

- Root `layout.tsx`, nested layout composition, protected-route wrappers
- Server Action return shape convention: `{ data } | { error }`
- Shared request parsing, validation wrappers, error normalization utilities
- Organization/environment scoping middleware or guards
- Reusable table/list/filter/pagination hooks

**Adapt:**

- Rename route groups conceptually:
    - project/workspace → study
    - contact → participant
    - response → record/surveyResponse
- Replace product copy with i18n keys via `t()`

---

## B) Auth + membership/tenancy

**Keep:**

- Auth.js configuration files and callbacks
- Session enrichment patterns (user/org/membership context)
- Membership resolution utilities used per request
- 2FA/session/account lifecycle handling

**Adapt:**

- Extend role enums (study roles, DAG constraints)
- Add permission matrix resolver (e.g., `hasPermission(user, "record.read", studyId)`)

---

## C) Database/Prisma (`packages/database`)

**Keep:**

- Prisma setup files (`schema`, client generation, migration scripts, seed scripts)
- Existing multi-tenant scoping conventions
- Soft-delete filtering patterns
- Transaction helpers and repository patterns

**Adapt/Add:**

- New clinical models (Study, Instrument, Field, Event, Arm, Participant, Record, RecordValue, AuditLog, ExportJob, DAG)
- Keep JSON columns only for renderer snapshots/versioned configs; core clinical data relational
- Add indexes for:
    - `(organizationId, studyId, isActive)`
    - record retrieval by participant/event/instrument
    - audit log by entity/time/user

---

## D) Survey builder/runtime (`packages/surveys`, `packages/survey-ui`)

**Keep:**

- Question/field renderer abstraction
- Page/step navigation logic
- Validation pipeline orchestration
- Submission state machine (loading/success/failure)
- Shared UI controls for input types

**Adapt heavily:**

- “Question” → “Field”
- Output sink: from generic response JSON to `Record/RecordValue` + `SurveyResponse`
- Add clinical metadata:
    - instrument version
    - event/arm context
    - DAG context
- Add branching logic compatible with clinical rules

---

## E) Types/validation/logging

**Keep:**

- Shared schema/type package boundaries
- Zod schema co-location pattern
- Logger interface + contextual metadata injection

**Add/Adapt:**

- Clinical Zod schemas:
    - field definition
    - branching DSL
    - record value constraints
- Audit logger function boundary:
    - `logAuditEvent({ actorId, entityType, entityId, action, before, after, studyId, orgId })`

---

## 3) Suggested concrete folder target (Continium-aligned inside current monorepo)

- `apps/web/modules/auth` ✅ keep pattern
- `apps/web/modules/organizations` ✅ keep + rename semantics
- `apps/web/modules/studies` 🆕
- `apps/web/modules/instruments` 🆕 (from surveys builder patterns)
- `apps/web/modules/fields` 🆕
- `apps/web/modules/participants` 🆕 (from contacts)
- `apps/web/modules/records` 🆕 (from responses)
- `apps/web/modules/events` 🆕
- `apps/web/modules/permissions` 🆕
- `apps/web/modules/audit` 🆕
- `apps/web/modules/exports` 🆕

And in packages:

- `packages/clinical-core` 🆕
- `packages/validation` 🆕 (if separating from existing types)
- keep `packages/database`, `packages/types`, `packages/logger`, `packages/survey-ui`, `packages/surveys`

---

## 4) Function-level “keep templates” you should preserve everywhere

Preserve these function contracts/patterns as you refactor:

- `authorizeX(...)` guards before service calls
- `validateWithZod(schema, payload)` before DB writes
- server action shape:  
    `return { data }` on success, `return { error }` on failure
- repository methods scoped by org/study:
    - `findById({ id, organizationId })`
    - `list({ organizationId, studyId, ...filters })`
- caching helpers via `cache()` / `cache.withCache()` + `createCacheKey.*`
- date/time output through shared formatting helper only
- i18n via `t()` for all user-facing copy

---

## 5) Phased “keep-first” execution checklist

1. **Freeze baseline**
    
    - Tag branch: `baseline/formbricks-core`
    - Document keep/adapt/drop matrix in `docs/formbricks-patterns.md`
2. **Hard-exclude non-core**
    
    - Remove route exposure/import paths to billing/integrations/ee
    - Keep compile green
3. **Preserve infra contracts**
    
    - Auth/session, org membership, Prisma client, logger, shared UI primitives
4. **Introduce clinical schema in parallel**
    
    - Add new Prisma models without deleting old survey tables initially
    - Create adapter services bridging old survey runtime to new record tables
5. **Swap modules gradually**
    
    - contacts→participants, responses→records, projects→studies
    - keep UI shell and developer ergonomics unchanged
6. **Cutover**
    
    - runtime writes to clinical models only
    - old survey response path read-only then retired

Below is an actionable inventory **seed list** from discovered high-impact files.  
⚠️ Code search tool returns limited results per call, so this is **not exhaustive yet**.  
View more in GitHub Code Search:

- [https://github.com/search?q=repo%3Aformbricks%2Fformbricks+path%3A%2F%5Eapps%5C%2Fweb%5C%2F%2F&type=code](https://github.com/search?q=repo%3Aformbricks%2Fformbricks+path%3A%2F%5Eapps%5C%2Fweb%5C%2F%2F&type=code)
- [https://github.com/search?q=repo%3Aformbricks%2Fformbricks+path%3A%2F%5Epackages%5C%2F%2F&type=code](https://github.com/search?q=repo%3Aformbricks%2Fformbricks+path%3A%2F%5Epackages%5C%2F%2F&type=code)

I’ll provide the inventory in your requested format:

|path|keep/adapt/drop|reason|owner|migration note|
|---|---|---|---|---|
|`apps/web/proxy.ts`|**keep + adapt**|Core request pipeline (auth gate, domain-aware routing, request-id headers)|Platform/Auth|Keep middleware structure; adapt route guards to study/institution paths and public survey domains|
|`apps/web/app/page.tsx`|**adapt**|Root post-login routing logic; currently environment/workspace-centric|App Core|Replace env redirect logic with Study landing resolver (`firstAccessibleStudy`)|
|`apps/web/app/error.tsx`|**keep**|Global error boundary + expected/unexpected error handling + Sentry integration|Platform/Frontend|Keep as-is; update i18n keys for Continium terminology only|
|`apps/web/lib/time.ts`|**keep**|Shared date formatting and locale-safe relative time; used broadly|Shared Utils|Keep helpers; add clinical date formatting helpers (visit/event windows)|
|`apps/web/next.config.mjs`|**keep + adapt**|Build/runtime config, tracing includes, Sentry, standalone output|DevEx/Platform|Keep all infra defaults; prune Formbricks-only package transpilation when package names change|
|`apps/web/vitestSetup.ts`|**keep + adapt**|Test runtime stability (NextAuth mocks, router mocks, ResizeObserver, prisma mock)|QA/Frontend|Keep harness; replace auth hook/action mock import paths after module rename|
|`apps/web/Dockerfile`|**keep + adapt**|Production-grade container build with secret mounts and standalone runner|DevOps|Keep multi-stage flow; update `--filter=@formbricks/web...` to new package names|
|`apps/web/.eslintrc.js`|**keep**|Lint baseline for app package|DevEx|Keep; revisit only if org-wide eslint config changes|
|`apps/web/.prettierrc.js`|**keep**|Formatting consistency and tailwind class sorting|DevEx|Keep unchanged|
|`apps/web/i18n.lock`|**adapt**|Translation checksum registry; currently Formbricks namespaces|Frontend/i18n|Regenerate after renaming keys from product-feedback terms to clinical terms|
|`packages/logger/src/logger.ts`|**keep**|Core structured logging + audit level + OTEL/pino transport strategy|Platform/Observability|Keep custom `audit` level; standardize audit event shape for clinical entities|
|`packages/types/i18n.ts`|**keep**|Fundamental multilingual string contract|Shared Types|Keep as-is; useful for instrument labels and multilingual consent text|
|`packages/types/activity.ts`|**adapt**|Activity feed schema currently tied to event/attribute/display product model|Clinical Core|Refactor to audit-oriented activity types (record_update, export_run, permission_change)|
|`packages/types/ai.ts`|**drop (MVP)**|AI provider enum not required for initial clinical MVP|Platform|Move to backlog; keep only if AI-assisted form design is planned soon|
|`packages/types/js.ts`|**adapt heavily**|Browser runtime survey/contact schemas tied to Formbricks JS embed model|Surveys/Clinical Core|Map `contact -> participant`, `responses -> record/surveyResponse`; remove trigger/display segmentation fields for MVP|
|`packages/surveys/i18n.lock`|**keep + adapt**|Survey runtime translations needed for respondent UX|Surveys Team|Keep structure; replace branding and wording keys; regenerate lock|
|`packages/email/src/components/email-template.tsx`|**adapt**|Shared email layout is useful but currently hardcoded Formbricks branding links/assets|Comms/Frontend|Replace logo/link constants with tenant/study brand config; keep component architecture|
|`packages/email/README.md`|**keep + adapt**|Documents package boundaries and preview workflow|DevEx|Keep architecture guidance; update examples to Continium mailers|
|`packages/email/.eslintrc.cjs`|**keep**|Package lint config|DevEx|Keep unchanged|
|`packages/config-eslint/library.js`|**keep**|Monorepo-wide typescript/node linting standard|DevEx|Keep; ensure new packages extend this consistently|

---

### Quick “owner” mapping recommendation

Use these default owners while executing migration:

- **Platform/Auth**: auth, middleware, session context, routing protection
- **App Core**: app router + dashboard navigation
- **Clinical Core**: study/instrument/record domain model mapping
- **Surveys Team**: builder/runtime/respondent flow
- **DevEx**: lint, formatting, CI, build ergonomics
- **Observability**: logging, tracing, Sentry, audit pipeline


Implemented direction confirmed. I haven’t actually executed the full traversal yet in this chat, so here is **Inventory v2 (working draft, prioritized)** for `formbricks/formbricks`, excluding `apps/web/modules/ee`, structured for immediate migration planning.

|path|keep/adapt/drop|reason|owner|migration note|
|---|---|---|---|---|
|apps/web/app/layout.tsx|keep+adapt|App shell entrypoint|App Core|Keep provider stack; rename app branding/routes|
|apps/web/app/page.tsx|adapt|Root redirect logic|App Core|Replace environment-first redirect with study-first|
|apps/web/app/error.tsx|keep|Global client error boundary|Platform|Keep Sentry + expected error handling|
|apps/web/app/not-found.tsx|keep+adapt|404 boundary|App Core|Update clinical wording|
|apps/web/app/loading.tsx|keep|Global loading UX|App Core|Reuse unchanged|
|apps/web/proxy.ts|keep+adapt|Request middleware/auth/domain routing|Platform/Auth|Keep request-id/auth checks; adapt domain rules|
|apps/web/lib/constants.ts|keep+adapt|Global constants used everywhere|Platform|Replace product names/URLs|
|apps/web/lib/env.ts|keep+adapt|Runtime env validation|Platform|Add clinical feature flags|
|apps/web/lib/time.ts|keep|Shared date/time helpers|Shared Utils|Extend for visit/event date windows|
|apps/web/lib/cache.ts|keep|Caching primitives|Platform|Keep keys + invalidation patterns|
|apps/web/lib/cache-utils.ts|keep|Cache helper wrappers|Platform|Retain API contracts|
|apps/web/lib/utils/datetime.ts|keep|Display formatting|Shared Utils|Keep as utility base|
|apps/web/lib/utils/url.ts|keep+adapt|Callback URL validation|Security|Keep hardening; adapt allowed hosts|
|apps/web/lib/instance/service.ts|adapt|Fresh-instance bootstrap flow|App Core|Reframe setup to institution/study bootstrap|
|apps/web/lib/user/service.ts|keep+adapt|User retrieval/business logic|Auth|Keep patterns; add study-scoped helpers|
|apps/web/lib/organization/service.ts|keep+adapt|Tenancy root model service|Clinical Core|Map organization→institution|
|apps/web/lib/membership/service.ts|keep+adapt|Role lookup logic|Auth/Permissions|Extend role model to study roles|
|apps/web/lib/membership/utils.ts|adapt|Access flags|Auth/Permissions|Replace owner/manager flags with granular perms|
|apps/web/lib/project/service.ts|adapt|Project/environment service|Clinical Core|Re-map project/environment → study/stage|
|apps/web/modules/auth/lib/authOptions.ts|keep+adapt|Auth.js central config|Auth|Keep callbacks/session strategy|
|apps/web/modules/auth/lib/proxy-session.ts|keep|Middleware session extraction|Auth|Keep for proxy auth gates|
|apps/web/modules/auth/actions/sign-out.ts|keep|Logout action|Auth|Keep behavior|
|apps/web/modules/auth/hooks/use-sign-out.ts|keep|Client auth hook|Auth|Keep import surface|
|apps/web/modules/auth/components/*|keep+adapt|Login/forgot/reset UI|Auth|Keep UX primitives; update terminology|
|apps/web/modules/ui/components/button.tsx|keep|UI primitive|Design System|Reuse directly|
|apps/web/modules/ui/components/dialog.tsx|keep|UI primitive|Design System|Reuse directly|
|apps/web/modules/ui/components/input.tsx|keep|UI primitive|Design System|Reuse directly|
|apps/web/modules/ui/components/table.tsx|keep|Core data grid primitive|Design System|Base for records/participants|
|apps/web/modules/ui/components/error-component.tsx|keep|Standard error rendering|Design System|Keep shared patterns|
|apps/web/modules/ui/components/client-logout.tsx|keep|Session invalidation fallback|Auth|Keep unchanged|
|apps/web/modules/ui/hooks/use-mobile.ts|keep|Device breakpoint utility|Design System|Keep unchanged|
|apps/web/modules/ui/hooks/use-toast.ts|keep|Notification abstraction|App Core|Keep API stable|
|apps/web/modules/ui/lib/cn.ts|keep|className utility|Design System|Keep unchanged|
|apps/web/modules/organization/*|adapt|Org CRUD/nav|Clinical Core|Rename to institutions where needed|
|apps/web/modules/project/*|adapt|Project domain|Clinical Core|Convert to study domain|
|apps/web/modules/environment/*|adapt|Env domain|Clinical Core|Convert to draft/production study stages|
|apps/web/modules/survey/*|adapt heavily|Existing survey lifecycle|Surveys|Convert survey to instrument+survey instance|
|apps/web/modules/response/*|adapt heavily|Response persistence|Clinical Core|Split to Record/RecordValue + SurveyResponse|
|apps/web/modules/contact/*|adapt heavily|Contact model|Clinical Core|Convert to Participant model|
|apps/web/modules/integration/*|drop (MVP)|External integrations|Platform|Remove until post-MVP|
|apps/web/modules/billing/*|drop|Non-clinical core|Platform|Exclude for Continium MVP|
|apps/web/modules/analytics/*|drop (MVP)|Product analytics logic|Platform|Revisit later|
|apps/web/modules/workspace/*|adapt|Workspace UX shell|App Core|Reframe as study workspace|
|apps/web/modules/team/*|adapt|Team membership UI|Permissions|Extend with study roles|
|apps/web/modules/settings/*|keep+adapt|Configuration surfaces|App Core|Keep scaffolding; trim non-MVP sections|
|apps/web/modules/ee/*|drop|Enterprise-licensed|Legal/Platform|Exclude entirely|
|apps/web/app/api/auth/[...nextauth]/route.ts|keep+adapt|Auth entrypoint|Auth|Keep route wiring|
|apps/web/app/api/*/route.ts|adapt selectively|API surfaces|Platform|Preserve only required endpoints|
|apps/web/app/(app)/**/page.tsx|adapt|Feature entry pages|App Core|Rename route segments to clinical concepts|
|apps/web/app/(app)/**/actions.ts|adapt|Server actions per feature|Feature Teams|Insert permission checks everywhere|
|apps/web/app/(app)/**/loading.tsx|keep|UX consistency|App Core|Keep as-is|
|apps/web/app/(app)/**/error.tsx|keep+adapt|Feature-level resilience|App Core|Keep boundaries|
|apps/web/i18n.lock|adapt|Translation checksum|Frontend|Regenerate after key changes|
|apps/web/vitestSetup.ts|keep+adapt|Test harness baseline|QA|Update mocks for renamed modules|
|apps/web/next.config.mjs|keep+adapt|Build/runtime critical|Platform|Keep standalone, Sentry, tracing|
|apps/web/package.json|keep+adapt|Scripts/deps|DevEx|Prune non-MVP deps|
|apps/web/tsconfig.json|keep|TS baseline|DevEx|Keep strict settings|
|apps/web/tailwind.config.js|keep+adapt|UI theming|Design System|Keep tokens; add clinical brand tokens|
|apps/web/postcss.config.js|keep|Build config|DevEx|Keep unchanged|
|apps/web/Dockerfile|keep+adapt|Prod containerization|DevOps|Update package filters/names|
|packages/database/prisma/schema.prisma|adapt heavily|Source of truth data model|Clinical Core|Introduce Study/Instrument/Record relational model|
|packages/database/prisma/migrations/*|adapt|DB evolution history|Data|Keep only relevant lineage for new fork|
|packages/database/src/client.ts|keep|Prisma client singleton|Data Platform|Preserve API|
|packages/database/src/index.ts|keep+adapt|Package exports|Data Platform|Export new clinical models|
|packages/database/package.json|keep+adapt|Build/dependency config|DevEx|Update scripts for new models|
|packages/database/tsconfig.json|keep|TS config|DevEx|Keep|
|packages/types/index.ts|keep+adapt|Shared contract barrel|Shared Types|Add clinical types|
|packages/types/user.ts|keep+adapt|User contract|Auth|Extend with clinical metadata if needed|
|packages/types/organization.ts|adapt|Tenancy types|Clinical Core|org→institution naming or alias|
|packages/types/project.ts|adapt heavily|Project types|Clinical Core|Replace with study types|
|packages/types/membership.ts|adapt|Membership types|Permissions|Add StudyRole + Permission|
|packages/types/surveys/types.ts|adapt heavily|Survey schema|Surveys|Split instrument vs runtime survey|
|packages/types/response.ts|adapt heavily|Response contract|Clinical Core|Introduce RecordValue/SurveyResponseValue|
|packages/types/contact.ts|adapt heavily|Contact contract|Clinical Core|Convert to Participant|
|packages/types/errors.ts|keep+adapt|Cross-app error model|Platform|Add clinical permission/domain errors|
|packages/types/common.ts|keep|Shared ids/base schemas|Shared Types|Reuse|
|packages/types/i18n.ts|keep|i18n schema|Shared Types|Reuse|
|packages/types/activity.ts|adapt|Activity feed types|Audit|Map to audit event taxonomy|
|packages/types/js.ts|adapt heavily|Embed/runtime state schema|Surveys|Remove segmentation/trigger-heavy fields|
|packages/types/ai.ts|drop (MVP)|Non-core|Platform|Park for later|
|packages/logger/src/logger.ts|keep+adapt|Structured logging core|Observability|Preserve `audit` level; standardize audit payload|
|packages/logger/src/index.ts|keep|Export surface|Observability|Keep|
|packages/logger/types/logger.ts|keep|Log level typing|Observability|Keep|
|packages/logger/package.json|keep|Package infra|DevEx|Keep|
|packages/surveys/src/index.ts|keep+adapt|Survey engine exports|Surveys|Keep abstraction boundary|
|packages/surveys/src/lib/*|adapt heavily|Core survey logic|Surveys|Map question->field, response sink rewrite|
|packages/surveys/src/components/*|keep+adapt|Runtime UI components|Surveys/UI|Keep primitives; update labels/flow|
|packages/surveys/src/utils/*|keep+adapt|Validation/navigation helpers|Surveys|Keep patterns|
|packages/surveys/i18n.lock|adapt|Runtime translation checksums|Frontend|Regenerate after terminology migration|
|packages/surveys/package.json|keep+adapt|Build/deps|DevEx|Keep, prune non-MVP deps|
|packages/survey-ui/src/index.ts|keep|Rendering component exports|UI/Surveys|Keep package as UI layer|
|packages/survey-ui/src/components/*|keep+adapt|Reusable survey widgets|UI/Surveys|Keep controls; add clinical field types|
|packages/survey-ui/src/hooks/*|keep|UI runtime hooks|UI/Surveys|Keep|
|packages/survey-ui/package.json|keep|Package plumbing|DevEx|Keep|
|packages/email/src/index.ts|keep+adapt|Email render entrypoints|Comms|Keep architecture|
|packages/email/src/components/email-template.tsx|adapt|Brand/legal footer hardcoded|Comms/UI|Tenant branding + legal text by institution|
|packages/email/src/emails/auth/*|keep+adapt|Account lifecycle emails|Auth/Comms|Keep core|
|packages/email/src/emails/invite/*|keep+adapt|Team invitation flow|Permissions/Comms|Adapt study-team language|
|packages/email/src/emails/survey/*|adapt|Survey invitation/follow-up|Surveys/Comms|Align to participant + event scheduling|
|packages/email/src/lib/*|keep|Template helper utilities|Comms|Keep|
|packages/email/README.md|keep+adapt|Package architecture docs|DevEx|Update examples and naming|
|packages/email/package.json|keep+adapt|Build/deps|DevEx|Keep; prune unnecessary templates if MVP|
|packages/storage/src/index.ts|keep (later)|File abstraction|Platform|Needed for consent PDFs/attachments later|
|packages/storage/src/providers/*|keep (later)|S3/local providers|Platform|Keep but defer integration|
|packages/storage/package.json|keep (later)|Infra|DevEx|Keep|
|packages/cache/src/index.ts|keep (later)|Cache/rate-limit abstractions|Platform|Introduce post-MVP/perf phase|
|packages/cache/package.json|keep (later)|Infra|DevEx|Keep|
|packages/config-eslint/library.js|keep|Shared linting baseline|DevEx|Keep org-wide standards|
|packages/config-eslint/next.js|keep|Next lint preset|DevEx|Keep|
|packages/config-typescript/base.json|keep|TS baseline|DevEx|Keep strictness|
|packages/config-typescript/nextjs.json|keep|Next TS config|DevEx|Keep|
|packages/config-typescript/library.json|keep|Library TS config|DevEx|Keep|
|packages/config-tailwind/*|keep|Shared style config|Design System|Keep consistency across apps|
|packages/ui/src/index.ts|keep+adapt|Shared design system entry|Design System|Keep and expand clinical components|
|packages/ui/src/components/*|keep|Reusable UI primitives|Design System|Keep mostly unchanged|
|packages/ui/package.json|keep|Package infra|DevEx|Keep|
|packages/auth/src/index.ts|keep+adapt|Shared auth helpers|Auth|Ensure compatibility with study-scoped perms|
|packages/auth/src/lib/*|adapt|Permission/session helpers|Auth/Permissions|Add DAG-aware permission helpers|
|packages/auth/package.json|keep|Infra|DevEx|Keep|
|packages/js/src/index.ts|adapt/drop|Browser widget SDK related|Platform|Drop for MVP unless embedded surveys needed|
|packages/js/src/lib/*|adapt/drop|Embed runtime behavior|Platform|Park until embed requirement confirmed|
|packages/js/package.json|adapt/drop|SDK package|DevEx|Keep only if roadmap includes embed|
|packages/client/src/index.ts|keep+adapt|Shared API client contracts|Platform|Update endpoint/type mappings|
|packages/client/src/lib/*|keep+adapt|Transport wrappers|Platform|Keep stable client ergonomics|
|packages/client/package.json|keep|Infra|DevEx|Keep|
|packages/ai/src/index.ts|drop (MVP)|Non-core for clinical MVP|Platform|Move to later phase|
|packages/ai/package.json|drop (MVP)|Infra for AI package|DevEx|Exclude from initial scope|
|packages/instrumentation/src/index.ts|keep|Observability bootstrap|Observability|Keep OTEL setup|
|packages/instrumentation/src/lib/*|keep+adapt|Tracing utilities|Observability|Add clinical span attributes|
|packages/instrumentation/package.json|keep|Infra|DevEx|Keep|
|packages/lib/*|keep+adapt|Cross-cutting shared helpers|Platform|Keep stable utilities, prune product-specific ones|
|packages/lib/package.json|keep|Infra|DevEx|Keep|
|packages/react-hooks/src/index.ts|keep|Shared hooks package|Frontend|Keep|
|packages/react-hooks/src/hooks/*|keep+adapt|Utility hooks|Frontend|Keep generic; rename domain-specific hooks|
|packages/react-hooks/package.json|keep|Infra|DevEx|Keep|
|packages/images/*|keep+adapt|Static branding assets|Design|Replace logos/brand kit|
|packages/images/package.json|keep|Asset package plumbing|DevEx|Keep|
|packages/server/src/index.ts|keep+adapt|Server shared utilities|Platform|Keep architecture, remap domain services|
|packages/server/src/lib/*|adapt|Backend service helpers|Platform/Clinical Core|Inject permission + audit middleware|
|packages/server/package.json|keep|Infra|DevEx|Keep|
