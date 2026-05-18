# Continium System Architecture

**Last Updated**: 2026-04-28  
**Current Version**: 1.1.0  
**Scope**: Data models, component interactions, API design, security model  

---

## System Overview

Continium is a dual-mode platform serving two distinct use cases:

| Mode | Purpose | Users | Features |
|------|---------|-------|----------|
| **PRODUCT** | Survey & CX feedback collection | Product teams, researchers | Survey builder, response collection, analytics |
| **CLINICAL** | EDC (Electronic Data Capture) for regulated trials | Clinical researchers, data managers | Protocol design, subject enrollment, audit trail, 21 CFR Part 11 compliance |

The toggle from PRODUCT → CLINICAL is **one-way in v1** (reverse in Phase 2). Each project operates in exactly one mode; the mode gates available features and UI.

---

## Data Model Hierarchy

### Tenancy & Organization

```
Organization (multi-tenant root)
  ├─ Membership[] (users + roles)
  ├─ Team[] (group-based access)
  ├─ ApiKey[] (programmatic access)
  ├─ OrganizationBilling (Stripe sync)
  └─ Project[]
```

**Key Points:**
- Single organization per self-hosted instance
- Multiple organizations supported in Continium Cloud (future)
- Memberships define user roles (owner, manager, member, billing)
- Teams enable group-based project access

### Project & Environments

```
Project (kind: PRODUCT | CLINICAL)
  ├─ kind (ProjectKind enum)
  ├─ Environment[] (exactly 2: production + development)
  ├─ Language[] (multilingual support)
  ├─ ProjectTeam[] (team access control)
  └─ Study (1:1, only if kind=CLINICAL)
```

**Key Points:**
- Every project has exactly 2 environments (production + development)
- `kind` field determines feature availability
- PRODUCT projects: standard survey functionality
- CLINICAL projects: unlock Study, Arm, Event, Subject, Enrollment models
- Languages scoped to project (multilingual surveys)

### Survey & Response Layer (PRODUCT mode)

```
Survey (per environment)
  ├─ Response[] (individual submissions)
  ├─ SurveyTrigger[] (when to show)
  ├─ SurveyAttributeFilter[] (who to show to)
  ├─ SurveyQuota[] (response limits)
  ├─ SurveyLanguage[] (available languages)
  ├─ SurveyFollowUp[] (automated actions)
  ├─ Display[] (show history)
  ├─ EventInstrument[] (P1.1+: clinical bindings)
  └─ questions, styling, customHeadScripts (JSON config)

Response
  ├─ Contact (optional: identified respondent)
  ├─ data (JSON: answer values)
  ├─ ttc (time-to-completion metrics)
  ├─ meta, variables (computed fields)
  └─ Tag[], QuotaLink[] (categorization)
```

**Key Points:**
- Surveys are environment-scoped (dev vs prod)
- Responses are immutable (never updated, only created)
- Contact linkage is optional (supports anonymous surveys)
- Questions stored as JSON (flexible schema, no table per question)

### Clinical Protocol Layer (CLINICAL mode only)

```
Study (1:1 with Project, only if kind=CLINICAL)
  ├─ name (protocol name)
  ├─ protocolId (optional: external ID, e.g., ClinicalTrials.gov)
  ├─ Arm[] (ordered list, position field)
  ├─ Subject[] (trial participants)
  └─ (Enrollment via Subject.enrollments)

Arm (study treatment group)
  ├─ name (unique per study)
  ├─ position (explicit order, supports drag-reorder)
  ├─ Event[] (visits within arm)
  └─ Enrollment[] (subjects in this arm)

Event (visit/assessment point)
  ├─ name (unique per arm, e.g., "Baseline", "Week 4")
  ├─ position (explicit order)
  ├─ dayOffset (days from enrollment)
  ├─ windowDays (visit window tolerance)
  └─ EventInstrument[] (forms to complete at this visit)

EventInstrument (junction, P1.1+)
  ├─ instrumentId (FK to Instrument.id, PUBLISHED only)
  ├─ required (boolean: must be completed)
  ├─ repeating (boolean: can be done multiple times)
  └─ (P1.3: now requires PUBLISHED Instrument versions)

Subject (trial participant)
  ├─ externalId (trial site ID, e.g., "SITE-001-SUBJ-042")
  ├─ contactId (optional: link to Contact for survey responses)
  ├─ Enrollment[] (arm assignments + status history)
  └─ (P1.2+: demographics, eligibility criteria)

Enrollment (subject lifecycle)
  ├─ subjectId → Subject
  ├─ armId → Arm
  ├─ status (enum: SCREENED, ENROLLED, ACTIVE, COMPLETED, WITHDRAWN, SCREEN_FAIL, LOST)
  ├─ enrolledAt, completedAt (lifecycle timestamps)
  ├─ dagId (P1.5: data access group for multi-site, enables row-level filtering)
  ├─ withdrawalReason (optional exit reason)
  └─ EnrollmentEvent[] (append-only transition history)

EnrollmentEvent (audit trail)
  ├─ fromStatus → toStatus (e.g., ENROLLED → ACTIVE)
  ├─ byUserId (who made the change)
  ├─ occurredAt (when)
  └─ reason (why)

Instrument (clinical form snapshot, P1.3+)
  ├─ surveyId (source survey; nullable for direct clinical authoring in future)
  ├─ version (int: monotonic per study/survey, enables versioning)
  ├─ status (DRAFT | PUBLISHED | ARCHIVED)
  ├─ publishedAt, publishedById (audit trail for publication)
  ├─ name, displayName (form identity)
  ├─ sourceSurveyHash, fieldHash (tamper-evidence prep for compliance)
  └─ InstrumentField[] (denormalized field list at publish-time)

InstrumentField (clinical field metadata, P1.3+)
  ├─ key (field identifier; from survey JSON)
  ├─ label (display label)
  ├─ type (field data type; maps survey element types → clinical types)
  ├─ required, position (field-level constraints + ordering)
  ├─ validationCode (optional: validation rule reference)
  ├─ choicesJson, branchingJson (option lists + conditional logic; parsed at query time)
  └─ (immutable after publish; new versions created for edits)
```

**Key Constraints:**
- Study is 1:1 with Project (only CLINICAL projects have Study)
- Arm.name unique per Study (prevents duplicate treatment groups)
- Event.name unique per Arm (prevents duplicate visits)
- EventInstrument FK to Instrument requires status=PUBLISHED (prevents binding unpublished forms)
- Subject.externalId unique per Study (no duplicate IDs within trial)
- Enrollment state machine enforces valid transitions (SCREENED → ENROLLED, not vice versa)
- Instrument (version, surveyId) composite: versions monotonic per survey, immutable after publish
- InstrumentField.position ordered within Instrument (preserves field layout order)

---

## Contact & Attribute Management

```
Contact (environment-scoped)
  ├─ attributes[] (custom properties)
  ├─ responses[] (survey responses)
  ├─ displays[] (survey show history)
  └─ subjects[] (linked trial subjects)

ContactAttributeKey (schema definition)
  ├─ key (identifier)
  ├─ name, description
  ├─ dataType (string, number, date)
  ├─ isUnique (enforced at constraint level)
  └─ ContactAttribute[] (actual values)

ContactAttribute
  ├─ value (string, flexible for backward compat)
  ├─ valueNumber (native float storage)
  ├─ valueDate (native date storage)
  └─ unique constraint on (contactId, attributeKeyId)
```

**Key Points:**
- Attributes are environment-scoped (different attributes per environment)
- Supports multiple data types (string, number, date)
- Indexes on (attributeKey, value) for efficient targeting
- Optional isUnique constraint for email, phone, etc.

---

## Audit & Compliance Layer

```
AuditLog (append-only, immutable, partitioned by month)
  ├─ id (UUID)
  ├─ occurredAt (partition key: YYYY-MM)
  ├─ event (AuditEvent enum: 50+ types)
  ├─ actorId, actorIp, userAgent (who did it, from where)
  ├─ projectId, resourceId, resourceType (what changed)
  ├─ diff (before/after JSON diff, optional)
  ├─ metadata (context, optional)
  └─ hash (reserved for tamper-evidence, null until Phase 3)

DataMigration (schema change tracking)
  ├─ name (unique)
  ├─ status (pending, applied, failed)
  ├─ startedAt, finishedAt
  └─ (used to verify all migrations applied before app starts)
```

**Key Properties:**
- **Immutability**: DB triggers prevent UPDATE/DELETE on audit_log
- **Partitioning**: Monthly partitions enable efficient archival and queries
- **No relations**: Stores raw IDs (survives when actors/projects deleted)
- **Compliance ready**: Structure supports 21 CFR Part 11 tamper-evidence (hash field)
- **Performance**: Composite indexes on (projectId, occurredAt), (actorId, occurredAt), (event, occurredAt)

**AuditEvent Enums** (Phase 0 foundation, being populated in Phases 1+):

| Category | Events |
|----------|--------|
| **User** | USER_REGISTERED, USER_LOGIN, USER_LOGIN_FAILED, USER_LOGOUT |
| **Organization** | ORG_CREATED, ORG_MEMBER_ADDED, ORG_MEMBER_REMOVED |
| **Project** | PROJECT_CREATED, PROJECT_UPDATED, PROJECT_DELETED, PROJECT_STATUS_CHANGED, PROJECT_KIND_CHANGED |
| **Forms** (EDC) | FORM_CREATED, FORM_UPDATED, FORM_DELETED, METADATA_PUBLISHED |
| **Records** (EDC) | RECORD_CREATED, RECORD_UPDATED, RECORD_DELETED, RECORD_RESTORED, RECORD_VALUE_SET, RECORD_LOCKED, RECORD_UNLOCKED, RECORD_SIGNED |
| **Survey** | SURVEY_ENABLED, SURVEY_OPENED, SURVEY_CLOSED, SURVEY_SUBMITTED |
| **Participants** | PARTICIPANT_ADDED, PARTICIPANT_REMOVED |
| **Access** | INVITATION_SENT, INVITATION_USED, ROLE_CREATED, ROLE_UPDATED, ROLE_DELETED, MEMBERSHIP_GRANTED, MEMBERSHIP_REVOKED |
| **Clinical** (P1.1+) | STUDY_CREATED, STUDY_UPDATED, ARM_CREATED, ARM_UPDATED, ARM_DELETED, ARM_REORDERED, EVENT_CREATED, EVENT_UPDATED, EVENT_DELETED, EVENT_REORDERED, EVENT_INSTRUMENT_BOUND, EVENT_INSTRUMENT_UNBOUND, SUBJECT_CREATED, SUBJECT_CONTACT_LINKED, ENROLLMENT_CREATED, ENROLLMENT_TRANSITIONED |

---

## Authentication & Authorization

### Authentication Methods

```
User (core identity)
  ├─ password (hashed, optional if using OAuth)
  ├─ Account[] (OAuth: GitHub, Google, Azure AD, OpenID, SAML)
  ├─ Session[] (active browser sessions)
  ├─ twoFactorSecret, twoFactorEnabled (optional 2FA)
  ├─ emailVerified, email (verified identity)
  └─ identityProvider (email, github, google, azuread, openid, saml)

Account (OAuth provider link)
  ├─ provider, providerAccountId (external ID)
  ├─ access_token, refresh_token (OAuth credentials)
  └─ expires_at (token expiry)

Session (browser session)
  ├─ sessionToken (opaque, stored in cookie)
  ├─ expires (hard expiry)
  └─ (revocable, server-side)
```

**Methods Supported:**
- Email + password
- OAuth (GitHub, Google, Azure AD, OpenID, SAML)
- Optional 2FA (TOTP)

### Authorization Model

```
Organization (root)
  └─ Membership (user role: owner, manager, member, billing)
      └─ Project access (via ProjectTeam)
          └─ Environment (production vs development)
              └─ Resources (surveys, contacts, responses)

Team (optional group-based access)
  └─ TeamUser (admin, contributor role)
      └─ ProjectTeam (read, readWrite, manage)
```

**Role Hierarchy:**
- **Owner**: Full control (billing, invites, team management)
- **Manager**: Can invite users, manage projects (can't change billing)
- **Member**: Basic access (read-only by default, team role determines write access)
- **Billing**: Stripe/payment management only

**Access Control:**
- Environment-level (dev vs prod are gated separately)
- Project-level (via ProjectTeam)
- Team-level (via TeamUser)
- Resource-level (API keys scope to environments + permissions: read, write, manage)

---

## API Layer & Server Actions

### Server Actions (Next.js)

For client-facing mutations, Continium uses Next.js Server Actions:

```
Pattern: Action → Validation → Authorization → Database → Audit Log

Example: updateArm()
  1. Parse input via Zod schema
  2. Verify arm belongs to project (access guard)
  3. Update arm in database
  4. Audit log entry created (by middleware or explicit call)
  5. Return updated state to client
  6. Client revalidates page/data
```

**Key Properties:**
- Direct client-to-server function calls (no JSON over HTTP)
- Zod validation on input
- Authorization guards before mutations
- No exposed OpenAPI/REST (v1 is internal API via server actions)
- Atomic transactions for multi-step operations (e.g., update project + audit log)

### REST API (Legacy & Programmatic)

```
GET /api/surveys - list surveys (read-scoped API key)
POST /api/responses - create response (write-scoped API key)
GET /api/contacts - list contacts (read-scoped API key)
```

**API Key Model:**
- Scoped to organization + specific environments
- Permissions: read, write, manage
- Stored hashed; lookup hash for validation
- LastUsedAt tracking for security audits

---

## Deployment Architecture

### Components

```
┌─────────────────────────────────────────────┐
│ Client (Next.js Browser)                    │
│  ├─ Survey UI (for respondents)             │
│  ├─ Dashboard (for researchers/managers)    │
│  └─ Protocol Designer (clinical mode)       │
└────────────┬────────────────────────────────┘
             │ HTTPS
┌────────────▼────────────────────────────────┐
│ Next.js App Server (SSR + Server Actions)   │
│  ├─ Route handlers (/api/*)                 │
│  ├─ Server actions (mutations)              │
│  ├─ Static generation (documentation)       │
│  └─ Middleware (auth, logging)              │
└────────────┬────────────────────────────────┘
             │ TCP 5432
┌────────────▼────────────────────────────────┐
│ PostgreSQL Database                         │
│  ├─ Partitioned audit_log (monthly)         │
│  ├─ Core tables (users, projects, surveys)  │
│  ├─ Clinical tables (study, arm, event...)  │
│  └─ Composite indexes for performance       │
└─────────────────────────────────────────────┘

Background Jobs (pg-boss):
  ├─ Partition creation (audit_log monthly)
  ├─ Report generation (scheduled)
  └─ Data cleanup/archival (retention policy)

External Services:
  ├─ Stripe (billing)
  ├─ Email (transactional)
  ├─ S3-compatible storage (file uploads)
  └─ OAuth providers (GitHub, Google, etc.)
```

---

## Performance & Scaling

### Query Patterns

| Pattern | Complexity | Optimization |
|---------|-----------|--------------|
| Get study with arms/events/instruments | O(1) SQL query | Single `include` chain (getStudyTree) |
| List contacts + filter by attribute | O(n) | Index on (attributeKeyId, value) |
| Get responses for survey | O(n) | Index on (surveyId, createdAt) |
| Audit trail for project | O(n) | Partitioned table, index on (projectId, occurredAt) |
| List identified respondents | O(n) | Index on (contactId, createdAt) |

**N+1 Prevention:**
- Clinical queries use single deep `include` chain
- Survey responses use batched queries
- Contact attributes use single query with joins (not loop)

### Indexing Strategy

**Critical Indexes:**
- `(projectId, kind)` — Clinical project lookup
- `(studyId, position)` on Arm — Sorted arm queries
- `(armId, position)` on Event — Sorted event queries
- `(surveyId, createdAt)` — Response timeline
- `(attributeKeyId, value)` — Contact attribute filtering
- `(projectId, occurredAt)` on AuditLog — Audit trail queries

**Partitioning:**
- AuditLog partitioned by month (occurredAt)
- Auto-creates next month's partition via trigger
- Enables efficient archival (drop old partitions)
- Queries automatically target relevant partitions

---

## Security Model

### Data Protection

| Layer | Mechanism | Notes |
|-------|-----------|-------|
| **Transport** | HTTPS/TLS 1.3 | Enforced for all connections |
| **Authentication** | Session tokens (httpOnly cookies) | Revocable, server-side |
| **Authorization** | Role-based (RBAC) + resource ownership | Checked before every mutation |
| **At-rest** | PostgreSQL native encryption (future) | Phase 2+ |
| **Audit trail** | Immutable AuditLog with tamper-evidence (hash field) | Phase 3+ |

### Compliance Readiness

**Phase 0-1 Foundation (Complete):**
- Audit log infrastructure (immutable, partitioned)
- Role-based access control
- Session-based authentication
- User action tracking (who, what, when)

**Phase 1.5 (Complete): Data Access Groups (DAGs)**
- Row-level security for multi-site clinical trials
- Site-scoped data access via DAG memberships
- Transparent AsyncLocalStorage-based request filtering
- See [Data Access Groups (DAGs)](#data-access-groups-dags) section

**Phase 2 (Planned):**
- Cryptographic audit trail hashing
- Data retention policies with automated deletion
- Query flag workflow for data review

**Phase 3 (Planned):**
- 21 CFR Part 11 validation reports
- GDPR data subject access request support
- Advanced compliance dashboards

### Secret Management

- Database credentials: Environment variables only (no hardcoded)
- API keys: Hashed at rest, lookup hash for validation
- OAuth tokens: Encrypted in database
- Session tokens: Opaque, 32-byte random (stored in httpOnly cookies)

---

## Data Access Groups (DAGs)

### Purpose

DAGs enable row-level security for multi-site clinical trials. In a typical trial, sites (or geographic regions) need isolated views of their own subject and enrollment data — a data manager at Site A should not see records from Site B.

**Key Use Case:**
- Multi-center trial: 10 sites, each with 50 subjects
- Each site manager has a DAG membership: site manager A → DAG-SITE-A
- When site manager A queries enrollments, middleware silently filters to `where: { dagId: { in: ['DAG-SITE-A'] } }`
- Result: Site A sees only their enrollments; Site B data is invisible to them

### Data Model

```
Study
  └─ DataAccessGroup[] (scoped to study)

DataAccessGroup (site or region group)
  ├─ id (UUID)
  ├─ studyId (FK)
  ├─ name (e.g., "Boston Medical Center", "Site 001")
  ├─ createdAt, updatedAt
  ├─ DagMember[] (users → roles mapping)
  └─ Enrollment[] (data points in this DAG)

DagMember (user ↔ DAG mapping)
  ├─ dagId (FK)
  ├─ userId (FK, must have org membership in project's org)
  ├─ role (enum: "viewer", "data_manager", "site_principal_investigator")
  └─ (enforces org membership guard: cannot add users outside org)

Enrollment (modified in P1.5)
  ├─ dagId (FK, nullable for Phase 2 migration period)
  ├─ ... (other fields unchanged)

Record (clinical form response, modified in P1.5)
  ├─ dagId (denormalized from enrollment, enables efficient filtering)
  ├─ ... (other fields unchanged)
```

**Storage:**
- `DataAccessGroup` table indexed on (studyId, name) for fast lookup
- `DagMember` table indexed on (dagId, userId) for membership checks
- `Enrollment` table indexes on dagId + status for efficient scoped queries
- `Record` table indexed on dagId for clinical form data filtering

### Request-Time Filtering via AsyncLocalStorage

DAG filtering operates transparently at the Prisma middleware layer:

```typescript
// User authenticates → middleware resolves their DAG IDs
const userDagIds = await getUserDagIds(userId);  // ['DAG-001', 'DAG-003']

// Every request wrapped with DAG context
withDagContext({ userDagIds, bypass: false }, async () => {
  // All queries to Record, Enrollment automatically scoped:
  const enrollments = await db.enrollment.findMany();
  // → SQL: WHERE dag_id IN ('DAG-001', 'DAG-003')
});
```

**Context Scopes:**
- `userDagIds: null` → **Bypass mode** (system jobs, background processes, org admin paths)
  - No DAG filter applied; all records visible
  - Used for data migration, reporting, pg-boss background jobs
- `userDagIds: []` → **No memberships** (user looked up but assigned to no DAGs)
  - All queries return empty sets
  - User sees "no data" rather than permission error
- `userDagIds: ['DAG-001', ...]` → **Scoped mode** (normal researcher)
  - Middleware injects `dagId: { in: userDagIds }` on every read

**Middleware Behavior:**
- Only filters reads (`findMany`, `findFirst`, `findUnique`, `count`, `aggregate`)
- Writes pass through unchanged (caller must supply `dagId` explicitly)
- Non-clinical models (Survey, Instrument, etc.) unaffected
- No context → pass through (safe for system paths)

### UI & Administration

**DAG Management Page** (`/clinical/dags`)
- List all DAGs in study (create/edit/delete)
- Add/remove members from each DAG
- Org membership guard: cannot add users outside the organization
- Role-based admin checks (owner/manager only)

**Subject Roster**
- DAG filter dropdown on subject list page
- Researchers see only subjects in their assigned DAGs
- Enrollments automatically scoped by middleware

### Phase 2 Deferred Items (EDGE-5, EDGE-6, EDGE-7)

1. **Request Lifecycle Wiring (EDGE-5)**
   - DAG context must be resolved before every request
   - Deferred: integrate into Next.js middleware or request context
   - Current: manual wrapping in server actions (works but requires discipline)

2. **Record.dagId Resync (EDGE-6)**
   - When enrollment.dagId changes, Record.dagId must update
   - Deferred to Phase 2 (low-frequency operation; batch job acceptable)
   - Currently: Record.dagId set at create time, immutable

3. **No-Membership Policy Decision (EDGE-7)**
   - If user has no DAG memberships: should they see all data (bypass) or nothing (deny)?
   - Current approach: deny (return empty, no error)
   - Deferred: confirm with compliance team before Phase 2

### Query Patterns & Performance

**Clinical Trial Researcher Workflow:**
```
1. User logs in → middleware resolves DAGs (lookup `dag_member` table)
2. View enrollments for my study → SQL applies dagId filter
   Cost: O(1) index lookup (dagId is indexed on enrollment)
3. Open enrollment timeline → O(1) enrollment record + O(n) events
4. Submit form response → Record created with dagId from enrollment
```

**Indexes for DAG Queries:**
- `enrollment(study_id, dag_id, status)` — Scoped study list
- `record(dag_id, created_at)` — Scoped form response timeline
- `dag_member(dag_id, user_id)` — Fast membership checks
- `data_access_group(study_id, name)` — Name-based DAG lookup

### Security Considerations

**Access Control:**
- DAG CRUD operations: owner/manager role required (checked in server actions)
- Member add/remove: verified against org membership (cannot add external users)
- Read filtering: enforced at Prisma middleware (no escape hatch without bypass context)

**Bypass Scenarios (Audit Trail):**
- Background jobs (pg-boss workers) run in bypass mode for data maintenance
- Org admins can view any data via explicit bypass context (audited separately)
- All bypass access MUST be logged in AuditLog (future enforcement)

**Limitation:**
- Row-level security (PostgreSQL RLS) not yet enabled; DAG filtering is application-level
- Leakage possible if code path bypasses middleware (e.g., raw SQL query)
- Mitigation: code review, no direct Prisma `$queryRaw`, middleware placement before all clinical queries

---

## Design Principles

### Tenancy & Data Isolation

**Multi-tenant Architecture:**
- Organization is the isolation boundary
- Environment (dev vs prod) provides secondary isolation
- All queries filtered by organization ID + environment
- No cross-org data leakage possible (enforced at query level)

**Pragmatic Approach:**
- Single organization per self-hosted instance (practical for on-prem)
- Row-level security (RLS) not used yet (v1 relies on application logic)
- Plan for RLS if multi-tenant SaaS in future

### Auditability & Compliance

**Every Material Change is Recorded:**
- User actions → AuditLog entry
- State transitions → AuditLog + append-only history tables (EnrollmentEvent)
- API access → AuditLog (lastUsedAt on ApiKey)

**Immutability First:**
- AuditLog cannot be updated/deleted (DB triggers enforce)
- Enrollment lifecycle tracked separately (EnrollmentEvent)
- Never overwrite raw data; create new records instead

### Ordering & Determinism

**Explicit > Implicit:**
- Arm/Event ordering uses explicit `position` field (not creation time)
- Enables drag-reorder UX
- Handles deletions cleanly (no gaps in positions)
- Supports concurrent updates (last-write-wins, acceptable for v1)

### Scalability & Flexibility

**Schemaless Where Needed:**
- Survey questions stored as JSON (flexible form definitions)
- Response data stored as JSON (answers vary by survey)
- Project config stored as JSON (extensible settings)
- This allows evolution without migrations

**Strong Schema Where It Matters:**
- Audit trail (strict schema, immutable)
- User/org/project (core entities, migrations required)
- Clinical protocol (forms strict schema to enable compliance)

---

## Integration Points

### Planned Integrations (Phase 3+)

| System | Purpose | Format |
|--------|---------|--------|
| HL7 FHIR | Healthcare data exchange | FHIR JSON-LD |
| REDCap | EDC interoperability | REDCap API + CRF export |
| Medidata Rave | EDC sync | Rave API (WebServices) |
| Slack | Notifications | Webhooks |
| Zapier | Automation | Zapier integration |

**API Design Principles:**
- Event-driven (webhooks for key events: survey submitted, enrollment created, etc.)
- Standard formats (JSON, FHIR, REDCap XML)
- Batch export/import support (avoid slow row-by-row APIs)
- OAuth for user-initiated integrations

---

## Change Log & Evolution

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-27 | ProjectKind enum + clinical gating | Enable CLINICAL mode foundation |
| 2026-04-28 | Study/Arm/Event/EventInstrument models | P1.1: Clinical protocol designer |
| 2026-04-28 | Position fields on Arm/Event | Enable drag-reorder UX |
| 2026-04-28 | Instrument model + versioning | P1.3: Form schema snapshot & publish lifecycle |
| 2026-04-28 | DataAccessGroup + DagMember tables | P1.5: Row-level security for multi-site trials |
| 2026-04-28 | dag-context.ts + dag-middleware.ts | P1.5: AsyncLocalStorage-based request filtering |
| 2026-04-28 | Enrollment.dagId + Record.dagId fields | P1.5: Denormalized DAG references for scoped queries |
| 2026-05-15 (planned) | Subject/Enrollment models | P1.2: Clinical subject management |
| 2026-05-20 (planned) | Typed audit events | P1.4: Clinical audit instrumentation |

---

## References

- **Code Standards**: `docs/code-standards.md` (coding conventions, error handling, patterns)
- **Development Roadmap**: `docs/development-roadmap.md` (phase planning, dependencies)
- **Project Changelog**: `docs/project-changelog.md` (release history)
- **Implementation Journals**: `docs/journals/` (detailed phase records)
- **Database Schema**: `packages/database/schema.prisma` (Prisma schema source of truth)
- **GitHub Repo**: https://github.com/continium/continium
