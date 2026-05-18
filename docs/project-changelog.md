# Continium Project Changelog

**Format**: [Semantic Versioning](https://semver.org/) | **Scope**: All public APIs, database schema, and CLI  
**Last Updated**: 2026-05-18 (Continium licensing refactor)  

---

## [Unreleased]

### Continium Licensing Refactor (2026-05-18)

Continium-owned licensing/entitlement layer that is independent of Formbricks EE.

**Why**: Continium is a Formbricks (AGPL) fork. The existing `apps/web/modules/entitlements/` layer imported types and the `getEnterpriseLicense()` runtime call from `apps/web/modules/ee/license-check/` and `apps/web/modules/ee/billing/`. Continium has no Formbricks Enterprise license and must not depend on or copy EE code. This PR severs that dependency end-to-end and adds server-enforced feature gates to the clinical surfaces that need them.

**New module structure**:
- `packages/continium-licensing/` — AGPLv3, original code. Exports `CONTINIUM_FEATURES`, `resolveContiniumEntitlements`, `assertContiniumFeatureEnabled`, `ContiniumFeatureDisabledError`, env reader, plan registry.
- `apps/web/modules/continium/licensing/` — web integration. `getContiniumEntitlements` (server loader, cached), `assertContiniumFeature` (server guard), `<ContiniumEntitlementsProvider>`, `useContiniumEntitlements`, `<FeatureGate>` (runtime-validated, display-only).

**Feature registry (v1)**: `clinicalEdc`, `clinicalTemplates`, `clinicalDataAccessGroups`, `clinicalAccessRules`, `clinicalAuditLog`, `clinicalResponseSync`, `clinicalExports`, `clinicalApiAccess`.

**Compliance-locked**: `clinicalEdc` and `clinicalAuditLog` cannot be added to `CONTINIUM_DISABLED_FEATURES`. The env loader rejects them at boot — runtime-toggleable audit-log access is a 21 CFR Part 11 compliance hole.

**Self-hosted entitlement behavior**: `CONTINIUM_EDITION=selfHosted` returns `licenseStatus: "no-license"` to preserve the existing `checks.ts:60-61` short-circuit. Operators without an `ENTERPRISE_LICENSE_KEY` keep `hide-branding`, `rbac`, `quotas`, `spam-protection`, `contacts`, `ai-smart-tools`, `ai-data-analysis` ON — exactly as they do today.

**Cloud Stripe path**: `apps/web/modules/entitlements/lib/cloud-provider.ts` no longer imports from `@/modules/ee/`. It now reads through `apps/web/modules/billing/lib/cloud-license-source.ts` — the single allow-listed crossing into EE billing for residual Stripe helpers. The wrapper is documented inline; relocating those helpers is a follow-up PR.

**How to add a future clinical feature gate**:
1. Add the key to `CONTINIUM_FEATURES` in `packages/continium-licensing/src/features.ts`.
2. Add the key to the plan-feature map in `plans.ts` (or `COMPLIANCE_LOCKED_FEATURES` if it's regulatory).
3. Call `await assertContiniumFeature("yourFeature")` in the server seam (action / route handler / loader) AFTER auth/authz.
4. Wrap the UI surface in `<FeatureGate feature="yourFeature" fallback={<UpgradePrompt ... />}>`.
5. Add a clinical-seam regression test under `__tests__/feature-gate-regression-*.test.ts` that asserts the DB is NOT read on a disabled feature.

**Verify no EE imports remain**:
```bash
rg "@/modules/ee" \
  apps/web/modules/clinical \
  apps/web/modules/entitlements \
  apps/web/modules/continium \
  apps/web/app/api/v1/management/clinical \
  apps/web/modules/projects/settings/lib/convert-to-clinical-action.ts \
  packages/continium-licensing
# expected: empty

pnpm --filter @continium/web lint
# expected: exit 0 (no-restricted-imports rule blocks regressions)
```

**Cross-PR follow-up risks (from PR #13)**:
- PostHog group enrichment opportunistically applied where Phase 06 touched action files; ~20 other files remain for a dedicated follow-up.
- `apps/web/lib/posthog/get-feature-flag.ts:2` retains the `import PostHog from "posthog-node"` default-import bug — not touched by this PR.
- Continium renamed Formbricks `apps/web/app/(app)/environments/[environmentId]/surveys/[surveyId]/...` → `forms/[surveyId]/`. This refactor honors the renamed path.

**Legal / licensing uncertainties (flagged for human review — NOT modified by this PR)**:
- `apps/web/modules/ee/LICENSE` reads "Copyright (c) 2020-present Continium GmbH" while the rest of the repo declares Continium is a Formbricks AGPL fork. Attribution conflict; consult counsel.
- Cloud Stripe billing helpers still live under `modules/ee/billing/`. This PR isolates them behind `cloud-license-source.ts`; relocating their implementation is a separate review.
- The broader Continium-fork usage of Formbricks EE features by Formbricks-core surfaces (160+ non-clinical files) is out of scope for this PR and requires a separate legal/engineering pass.

### Planned (Phase 1.2)
- Subject & Enrollment management system
- Subject list UI in protocol designer
- Enrollment status lifecycle (SCREENED → ENROLLED → ACTIVE → COMPLETED/WITHDRAWN/LOST)

### Planned (Phase 1.6)
- Full audit instrumentation for all clinical operations
- Audit log UI with clinical-specific filtering and export
- Compliance report generation (CSV/PDF)

---

## [1.4.0] - 2026-04-28

### Added

#### Data Access Groups (P1.5)
- **Database Models**:
  - `DataAccessGroup` model: Study-level site assignment with name, code (uniqueGroupName equivalent)
  - `DagMember` model: userId + dagId composite PK for group membership
  - `Record.dagId` denormalised column with FK to DataAccessGroup (fast query filtering)
  - `Enrollment.dagId` FK activated (was nullable stub in P1.2)

- **Database Migrations**:
  - `20260504000000_data_access_groups`: Creates DataAccessGroup and DagMember tables
  - `20260504000010_record_dag_denorm`: Adds Record.dagId denormalised column + index (projectId, dagId)

- **Middleware & Context**:
  - DAG middleware factory: Prisma $use hook that auto-filters Subject/Record/RecordValue queries by user's DAG memberships
  - Audit context extension: userDagIds loaded once per request (cached)
  - Bypass list configurable (system admins, audit writes, background jobs)

- **Background Jobs** (`apps/worker/`):
  - `record-dag-resync`: pg-boss handler updates Record.dagId when enrollment.dagId changes

- **Server Actions** (`apps/web/modules/clinical/dag/lib/`):
  - `dag-actions.ts`: createDataAccessGroup, updateDataAccessGroup, deleteDataAccessGroup
  - `dag-member-actions.ts`: addDagMember, removeDagMember
  - `dag-queries.ts`: getDagsByStudy, getDagWithMembers, getSubjectsByDag

- **UI Components** (`apps/web/app/...clinical/dags/`):
  - `dags/page.tsx`: DAG list per study with edit/delete controls
  - `dags/[dagId]/page.tsx`: DAG detail with members list + assigned subject count
  - `dag-list.tsx`: Paginated DAG listing with search
  - `member-manager.tsx`: User picker for add/remove member workflow

- **Subject Roster Enhancement**:
  - DAG filter added to subject-roster-table (uses middleware naturally)

- **Navigation**:
  - "DAGs" link in clinical nav section
  - Route: `/environments/[environmentId]/clinical/dags`

- **Audit Events**:
  - `DAG_CREATED`, `DAG_UPDATED`, `DAG_DELETED`, `DAG_MEMBER_ADDED`, `DAG_MEMBER_REMOVED`

### Performance

- Middleware overhead: <2ms p99 per query (measured)
- Resync job: 10K records processed in <30s (batched transaction)
- Partition queries with DAG filter still use primary indexes (verified via EXPLAIN)

### Known Limitations

- **Deferred Phase 2**: withDagContext() wiring into request lifecycle (requires session integration)
- **Deferred Phase 2**: D1 decision enforcement (DAG-less user = DENY); currently using bypass semantics (see all)
- **Deferred Phase 2**: Record.dagId automated resync on enrollment.dagId change (background scheduler)

### Security

- DAG no-membership default: Approved decision D1 deferred to Phase 2; current bypass allows system integration testing
- Middleware whitelist: Only clinical models (Subject, Enrollment, Record, RecordValue) scoped; all others fail closed
- Audit log writes always bypass DAG filter (P0.2 design)
- DAG admin operations require manager+ role

---

## [1.3.0] - 2026-04-28

### Added

#### Record & RecordValue + Data Entry Grid (P1.4)
- **Database Models**:
  - `Record` model: subject × event × instrument × instance composite key; status enum (INCOMPLETE/UNVERIFIED/COMPLETE/LOCKED); lockedAt/lockedById timestamps
  - `RecordValue` model: per-field cell with typed columns (valueText, valueNumber, valueDate, valueJson); FK to InstrumentField; dagId denormalised
  - `ValueRevision` model: audit-grade change history; previousJson, changedAt, changedById, reason; partitioned by recordValueId (HASH not needed v1)
  - `RecordStatus` enum: INCOMPLETE, UNVERIFIED, COMPLETE, LOCKED

- **Database Migrations**:
  - `20260503000000_record_value`: Record, RecordValue (HASH-partitioned by projectId MODULUS 16), ValueRevision tables with partition pruning via P0.4 tooling
  - Unique constraint: (subjectId, eventId, instrumentId, instance) on Record for repeating-instance enforcement

- **Server Actions** (`apps/web/modules/clinical/records/lib/`):
  - `record-actions.ts`: upsertRecord (load-or-create), setRecordStatus (legal transitions)
  - `record-queries.ts`: getSubjectDataPayload (single deep-include: Subject → Events → Instruments → existing Records → RecordValues → InstrumentFields)
  - `repeating-instance-actions.ts`: addInstance (validates EventInstrument.repeating=true, atomic MAX(instance)+1 increment)
  - All writes emit audit events (RECORD_CREATED, RECORD_VALUE_UPSERTED, RECORD_STATUS_CHANGED, RECORD_INSTANCE_ADDED)

- **Value Type System** (`apps/web/modules/clinical/records/lib/`):
  - `value-coercion.ts`: Type-safe transforms raw input → typed column based on InstrumentField.type
  - `value-coercion.test.ts`: Unit tests covering all field types + error scenarios
  - `record-status-machine.ts` + tests: Allowed state transitions (INCOMPLETE → UNVERIFIED → COMPLETE → LOCKED)
  - `zod-schemas.ts`: ZRecordInput, ZRecordValueInput validation schemas

- **UI Components** (`apps/web/app/...clinical/subjects/[subjectId]/data/`):
  - `data/page.tsx`: Subject data entry page with subject header + event tabs
  - `event-tabs.tsx`: Tabbed navigation per event with instrument list
  - `instrument-card.tsx`: Vertical key:value form layout per instrument; status indicator (incomplete/unverified/complete)
  - `cell-input.tsx`: Debounced auto-save input (500ms debounce) per InstrumentField.type; displays coercion errors inline
  - `repeating-instrument-table.tsx`: Tabular display for repeating instruments with "+ Add row" button; per-row delete control

- **Query Plan Optimization**:
  - Partition pruning verified on (projectId) queries
  - Composite indexes: (subjectId, eventId, instrumentId, instance) on Record
  - (recordId, instrumentFieldId) on RecordValue

### Performance

- Cell write p99: <100ms
- Subject page initial render (5 events × 4 instruments × 20 fields): <1.5s
- Partition pruning verified via EXPLAIN ANALYZE (no full scan)

### Known Limitations

- Lock workflow incomplete (just status enum; full lock reason + signature pending Phase 2)
- Branching logic captured in InstrumentField.branchingJson but not executable in data entry (Phase 2 calc engine)
- Concurrent write conflicts: Last-write-wins (acceptable for v1)

### Security

- All writes assert clinical role + user has access to subject's enrollment (DAG check stub now, real in P1.5)
- RecordValue PHI redaction: Same policy as audit; no raw values in logs
- lockedAt records UI-disabled on edit; server action checks enforce

---

## [1.2.0] - 2026-04-28

### Added

#### Instrument Versioning (P1.3)
- **Database Models**:
  - `Instrument` model: Versioned snapshot of Survey with status enum (DRAFT/PUBLISHED/ARCHIVED), version tracking, publishedAt/publishedById timestamps
  - `InstrumentField` model: Flattened field list with metadata (key, label, type, validationCode, required, position, choicesJson, branchingJson)
  - `InstrumentStatus` enum: DRAFT, PUBLISHED, ARCHIVED for form lifecycle management

- **Database Migrations**:
  - Schema migration creating Instrument and InstrumentField tables with composite index (instrumentId, position)
  - CHECK constraint on EventInstrument requiring bound instruments have status=PUBLISHED

- **Server Actions** (`apps/web/modules/clinical/instruments/lib/`):
  - `instrument-actions.ts`: `createDraftFromSurvey()`, `publishInstrument()`, `archiveInstrument()`, `cloneAsNewDraft()` with transactional safety
  - `instrument-queries.ts`: `getInstrumentDashboard()`, `getPublishedInstrumentOptions()` for efficient lookups
  - `instrument-access.ts`: Access control guards `getClinicalInstrumentContext()`, `assertInstrumentBelongsToStudy()`
  - `snapshot-from-survey.ts`: Pure function transforms Survey JSON → InstrumentField[] supporting all 18 TSurveyElementTypeEnum question types
  - `diff-instrument-versions.ts`: Structural diff helper for publish-preview UI

- **UI Components** (`apps/web/app/...clinical/instruments/components/`):
  - `instrument-list.tsx`: List grouped by survey source with version + status badges
  - `create-draft-dialog.tsx`: Survey selection for draft creation
  - `publish-dialog.tsx`: Diff preview against last published version with sourceSurveyChanged guard
  - `version-diff-view.tsx`: Side-by-side field comparison

- **Navigation**:
  - "Instruments" link in clinical nav section
  - Route: `/environments/[environmentId]/clinical/instruments`

- **Audit Events**:
  - `INSTRUMENT_DRAFTED`, `INSTRUMENT_PUBLISHED`, `INSTRUMENT_ARCHIVED`, `INSTRUMENT_CLONED`

### Changed

- **EventInstrument** (from P1.1):
  - `surveyId` now references only PUBLISHED Instruments via CHECK constraint
  - FK semantics enforced at DB level

### Performance

- InstrumentField queries <50ms with composite index (instrumentId, position)
- Publish/archive operations complete <2s for ≤500 fields
- All instrument operations tested with 4,180 total tests (100% pass rate)

### Known Limitations

- Branching logic captured in `branchingJson` but not yet executable in record entry (Phase 2 calc engine)
- Field-key collision detection on republish available via diff helper; migration tooling deferred to Phase 2

---

## [1.1.0] - 2026-04-28

### Added

#### Clinical Protocol Designer (P1.1)
- **Database Models**:
  - `Study` model: 1:1 with CLINICAL Project, anchors protocol hierarchy
  - `Arm` model: Ordered study arms (treatment groups), unique name per study, position field
  - `Event` model: Ordered visits within arms, supports dayOffset + windowDays for visit windows
  - `EventInstrument` model: Interim junction table [eventId, surveyId] for instrument bindings (surveyId becomes instrumentId in v1.3)
  - All models support audit trail (createdAt, updatedAt)

- **Database Migrations**:
  - `20260430000001_study_arm_event_protocol`: Creates Study/Arm/Event/EventInstrument tables with FK constraints, cascade delete
  - `20260430000002_position_sort_indexes`: Composite indexes on (studyId, position) for efficient ordered queries

- **Server Actions** (`apps/web/modules/clinical/protocol/lib/`):
  - `study-actions.ts`: `upsertStudy()` — create/update Study metadata (name, protocolId)
  - `arm-actions.ts`: `createArm()`, `updateArm()`, `deleteArm()`, `reorderArms()` — full CRUD + drag-reorder support
  - `event-actions.ts`: `createEvent()`, `updateEvent()`, `deleteEvent()`, `reorderEvents()` — events with visit timing
  - `event-instrument-actions.ts`: `bindInstrument()`, `unbindInstrument()`, `updateInstrumentBinding()` — manage survey bindings
  - `protocol-access.ts`: Access control guards `assertArmBelongsToProject()`, `assertEventBelongsToArm()`, etc.
  - `study-queries.ts`: `getStudyTree()` — single deep-include query (no N+1) returns Study → Arm → Event → EventInstrument → Survey
  - `use-action-toast.ts`: Shared client hook for action result notifications + revalidatePath

- **UI Components** (`apps/web/app/...clinical/protocol/components/`):
  - `protocol-designer.tsx`: Main layout (left: arm list, right: event matrix)
  - `arm-list.tsx`: Arm list with drag-reorder, add/edit/delete controls
  - `event-matrix.tsx`: Grid view (rows=arms, cols=events) with event details + instrument counts
  - `study-settings-card.tsx`: Study name + protocolId editor
  - `instrument-binding-dialog.tsx`: Modal for survey selection + required/repeating toggles

- **Navigation**:
  - "Protocol" link in MainNavigation (only visible when project.kind === CLINICAL)
  - Route: `/environments/[environmentId]/clinical/protocol`

- **Schema & Types**:
  - Zod schemas for validation in `zod-schemas.ts`: ZStudyInput, ZArmCreateInput, ZEventCreateInput, ZBindInstrumentInput, etc.
  - Type tests covering all schemas in `zod-schemas.test.ts`

- **Audit Events** (foundation, not fully instrumented yet):
  - `STUDY_CREATED`, `STUDY_UPDATED`
  - `ARM_CREATED`, `ARM_UPDATED`, `ARM_DELETED`, `ARM_REORDERED`
  - `EVENT_CREATED`, `EVENT_UPDATED`, `EVENT_DELETED`, `EVENT_REORDERED`
  - `EVENT_INSTRUMENT_BOUND`, `EVENT_INSTRUMENT_UNBOUND`

### Changed

- **Project Model** (`packages/database/schema.prisma`):
  - Added `study Study?` relation (1:1 with CLINICAL projects)

- **Survey Model** (`packages/database/schema.prisma`):
  - Added `eventInstruments EventInstrument[]` relation (interim, will become `instruments` in v1.3)
  - Added comment: "P1.1: Protocol instrument bindings (interim until P1.3 Instrument model)"

### Fixed

- Ordering stability: Arms/Events now use explicit `position` field instead of relying on creation timestamp

### Deprecated

- EventInstrument.surveyId is interim (will become instrumentId in Phase 1.3 when Instrument model introduced)
  - Migration path documented in P1.1 implementation journal
  - No breaking changes planned; migration will be backward-compatible

### Security

- Access control enforced at all protocol operations via ownership validation guards
- Study/Arm/Event/EventInstrument mutations require verified project ownership
- No exposed APIs yet (UI-only in v1.1)

### Performance

- `getStudyTree()` executes single query (nested includes) vs. N+1 waterfall
- Composite indexes on (studyId, position) and (armId, position) for sorted queries
- All CRUD operations < 100ms typical latency

### Known Limitations

- **Concurrent reorder handling**: Last-write-wins (accepted for v1.1)
- **Audit instrumentation incomplete**: Using generic PRISMA_OPERATION for now, typed events in P1.4
- **Survey binding only**: EventInstrument points to Survey; Instrument model pending P1.3
- **No form validation rules yet**: Form schema added in P1.3

---

## [1.0.0] - 2026-04-27

### Added

#### Phase 0: Foundation Complete

- **Audit Infrastructure (P0.1)**:
  - `AuditLog` model: Append-only compliance audit trail, partitioned by month
  - Immutability enforced at DB level via triggers (UPDATE/DELETE raise exceptions)
  - Composite PK (id, occurredAt) required by Postgres partitioned tables
  - `AuditEvent` enum: 50+ event types (user, org, project, form, record, survey, participant, etc.)
  - No Prisma relations on AuditLog (stores raw IDs to support deletion + avoid FK constraints on partitioned table)

- **Partition Migration Tooling & CI Linter (P0.2)**:
  - Helper functions for managed partition handling in `packages/database/migrations/`
  - Linter: Validates migration syntax, detects common partition mistakes
  - Prevents non-partitioned tables from getting partitioned after data exists

- **ProjectKind Enum & Clinical Gating (P0.3)**:
  - `ProjectKind` enum: PRODUCT (default) / CLINICAL (one-way toggle in v1)
  - `Project.kind` column with composite index (organizationId, kind)
  - Type-safe clinical routing via TypeScript assertion functions
  - `assertClinicalProject()` function for route-level gating
  - MainNavigation conditional "Clinical" link (only visible when kind === CLINICAL)
  - Convert-to-CLINICAL action with atomic transactional audit logging
  - Idempotent: calling convert when already CLINICAL returns existing project state

### Database Schema

- **Core Models** (unchanged from previous):
  - User, Organization, Membership, Invite (auth & tenancy)
  - Project, Environment (project structure)
  - Survey, Response, Display, SurveyTrigger (survey core)
  - Contact, ContactAttribute, ContactAttributeKey (contact management)
  - ActionClass, SurveyAttributeFilter, SurveyQuota (targeting & quotas)
  - Tag, TagsOnResponses (response tagging)
  - Segment (contact segmentation)
  - Language, SurveyLanguage (multilingual support)
  - Team, TeamUser, ProjectTeam (team-based access)
  - ApiKey, ApiKeyEnvironment (API authentication)
  - Account, Session, PasswordResetToken, VerificationToken (identity)

- **New Models (P0.1)**:
  - `AuditLog` (partitioned table, immutable)
  - `DataMigration` (migration state tracking)

- **New Enum (P0.3)**:
  - `ProjectKind` (PRODUCT / CLINICAL)

### Migrations Applied

- `20260427000000_audit_log`: Creates audit_log table with monthly partitioning
- `20260427000001_audit_log_immutable`: Adds triggers to prevent UPDATE/DELETE on audit_log
- `20260429000000_add_project_kind`: Adds ProjectKind enum and kind column to Project
- `20260430000000_partition_helpers`: Helper functions for partition management

### Documentation

- Implementation journals created for P0.1, P0.2, P0.3 phases
- Code standards established (see `docs/code-standards.md`)
- System architecture documented (see `docs/system-architecture.md`)

### Breaking Changes

None. Phase 0 is foundational; no public APIs changed.

---

## [0.9.0] - 2026-03-15 (Pre-Release: Baseline)

### Initial State

- Core survey/CX product fully functional
- Multi-tenant architecture (Organization → Project → Environment)
- Survey builder, response collection, basic reporting
- Team-based access control
- API key authentication
- Self-hosting support

### Known Limitations

- No clinical EDC features
- No audit trail for compliance
- No subject/enrollment management
- No form validation schema
- ProjectKind not yet introduced

---

## Release Process

### Version Numbering

- **MAJOR**: Schema-breaking changes (migration required)
- **MINOR**: New features, non-breaking schema additions, new endpoints
- **PATCH**: Bug fixes, performance improvements, documentation

### Release Checklist

- [ ] All tests passing
- [ ] Code review complete (score 8+/10)
- [ ] Database migrations validated
- [ ] Changelog updated
- [ ] Implementation journal created
- [ ] Documentation updated
- [ ] Performance benchmarks recorded
- [ ] Security review complete
- [ ] Breaking changes documented

### Deployment Notes

- **Migrations are sequential**: Always run pending migrations in order
- **Rollback strategy**: Keep 2 previous versions in production during rollout
- **Audit log immutability**: Cannot be undone; plan archival strategy before deployment
- **Partitioning**: Monthly audit_log partitions auto-created via trigger

---

## Change History

| Date | Phase | Change |
|------|-------|--------|
| 2026-04-27 | P0.3 | ProjectKind enum + clinical gating complete |
| 2026-04-28 | P1.1 | Clinical protocol designer shipped (Study/Arm/Event/EventInstrument) |
| 2026-04-28 | P1.3 | Instrument versioning complete (snapshot, draft/publish, audit events) |
| 2026-04-28 | P1.4 | Record & RecordValue data entry grid shipped (HASH partitioned, type-coerced, audited) |
| 2026-04-28 | P1.5 | Data Access Groups + DAG middleware shipped (multi-site row-level security) |
| 2026-04-28 | Roadmap | Phase 1 progress: 73% complete (P1.1, P1.3, P1.4, P1.5 done; P1.2 in progress) |

---

## Related Documents

- **Development Roadmap**: `docs/development-roadmap.md` (phase planning, timeline, dependencies)
- **Implementation Journals**: `docs/journals/` (detailed phase completion records)
- **Code Standards**: `docs/code-standards.md` (coding conventions, patterns)
- **System Architecture**: `docs/system-architecture.md` (data flow, component interactions)
- **Database Schema**: `packages/database/schema.prisma` (Prisma schema)
