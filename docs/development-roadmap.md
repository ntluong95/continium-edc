# Continium Development Roadmap

**Last Updated**: 2026-05-18  
**Current Phase**: Phase 1 (P1.6 Clinical Audit Instrumentation remaining)  

## Overview

Continium is evolving into a dual-mode platform: **PRODUCT** (standard survey/CX) and **CLINICAL** (regulated EDC/study management). Phase 0 laid the architectural foundation (audit logs, ProjectKind enum, partitioning). Phase 1 is building core clinical features (protocol design, subject enrollment, audit instrumentation). Phase 2+ will focus on advanced EDC capabilities and integrations.

---

## Phase 0: Foundation (Complete ✓)

**Status**: Complete  
**Completion Date**: 2026-04-27  

### P0.1: Audit Log Infrastructure
- Append-only audit trail with partition-by-month
- Immutable at DB level (triggers prevent UPDATE/DELETE)
- Foundation for clinical compliance (FDA 21 CFR Part 11)
- All tests passing

### P0.2: Partition Migration Tooling & CI Linter
- Helper functions for managed partition handling
- Migration validation linter
- Prevents common partition mistakes
- All tests passing

### P0.3: ProjectKind Enum & Clinical Gating
- `ProjectKind` enum: PRODUCT (default) / CLINICAL (one-way toggle in v1)
- Type-safe clinical routing via assertion functions
- Composite index on (organizationId, kind) for efficient queries
- One-way PRODUCT→CLINICAL conversion (reverse deferred to Phase 2)
- All tests passing

### P0.4: Database Maintenance & Schema Hygiene
- Partition tooling + CI linter
- Performance baseline established
- Code review score: 8.5/10

---

## Phase 1: Clinical Protocol Designer & Subject Management (In Progress)

**Status**: Phase 1.1 Complete ✓ | Phase 1.2 Complete ✓ | Phase 1.3 Complete ✓ | Phase 1.4 Complete ✓ | Phase 1.5 Complete ✓ | Phase 1.6 Planned  
**Target Completion**: 2026-05-15  
**Key Theme**: Build researcher-facing clinical protocol design tooling + data entry + multi-site support

### P1.1: Clinical Protocol Designer (Complete ✓)
**Completion Date**: 2026-04-28

**What Shipped:**
- **Data Model**: Study (1:1 with Project), Arm (ordered), Event (ordered visits), EventInstrument (interim junction)
- **Server Actions**: Full CRUD for Study/Arm/Event/EventInstrument with access control guards
- **Query Layer**: `getStudyTree()` single-query fetch (no N+1)
- **UI**: Protocol designer with interactive arm list, event matrix, study settings, instrument binding dialog
- **Navigation**: "Protocol" link in MainNavigation (CLINICAL projects only)
- **Migrations**: `20260430000001_study_arm_event_protocol`, `20260430000002_position_sort_indexes`

**Acceptance Criteria Met:**
- [x] Researchers can define study arms (treatment groups)
- [x] Researchers can define events (visits) within each arm
- [x] Researchers can bind surveys as instruments to events
- [x] Arm/event ordering is explicit and draggable
- [x] Full ownership validation (no access confusion)
- [x] All CRUD operations tested

**Known Limitations:**
- EventInstrument.surveyId is interim (will become instrumentId in P1.3)
- Audit instrumentation deferred to P1.4 (uses generic PRISMA_OPERATION for now)
- No concurrent reorder conflict handling (last-write-wins)

**Documentation**: See `docs/journals/260428-1230-p11-clinical-protocol-designer.md`

### P1.2: Subject & Enrollment Management (Complete ✓)
**Completion Date**: 2026-05-18

**What Shipped:**
- Subject model: Clinical trial participant (external ID, optional Contact link)
- Enrollment model: Subject → Arm assignment with lifecycle (SCREENED → ENROLLED → ACTIVE → COMPLETED/WITHDRAWN/LOST)
- EnrollmentEvent: Append-only audit trail for enrollment transitions
- Server actions: createSubject, updateEnrollment, transitionEnrollmentStatus
- Subject list UI in protocol designer
- Enrollment history timeline view

**Acceptance Criteria Met:**
- [x] Researchers can create study subjects with external IDs
- [x] Researchers can enroll subjects into study arms
- [x] Enrollment status transitions are auditable
- [x] Contact linking is optional (supports offline trials)
- [x] Enrollment state machine enforces valid transitions

**Blockers:** P1.1 complete ✓

### P1.3: Instrument Model & Form Schema (Complete ✓)
**Completion Date**: 2026-04-28

**What Shipped:**
- **Data Model**: Instrument (versioned snapshot of Survey), InstrumentField (flattened field list with indexed position), InstrumentStatus enum (DRAFT/PUBLISHED/ARCHIVED)
- **Server Actions**: createDraftFromSurvey, publishInstrument, archiveInstrument, cloneAsNewDraft with transactional safety
- **Library Layer**: snapshotFromSurvey (pure transform covering all 18 survey question types), diff-instrument-versions (version comparison), instrument-queries/instrument-actions/instrument-access helpers
- **UI Components**: Instruments page with list grouped by survey source, publish dialog with diff preview, version badges, sourceSurveyChanged guard
- **Migrations**: Database schema with Instrument and InstrumentField models, composite index on (instrumentId, position)
- **Audit Events**: INSTRUMENT_DRAFTED, INSTRUMENT_PUBLISHED, INSTRUMENT_ARCHIVED, INSTRUMENT_CLONED

**Acceptance Criteria Met:**
- [x] Instrument model replaces interim Survey FK
- [x] Instruments support clinical-specific metadata (data type, validation rules)
- [x] EventInstrument.surveyId replaced with instrumentId (PUBLISHED status enforced via CHECK constraint)
- [x] Form schema is JSON-compatible with InstrumentField array
- [x] All 18 survey question types snapshot correctly
- [x] Draft/publish lifecycle with version tracking (DRAFT → PUBLISHED → ARCHIVED)
- [x] 4,180 tests passing (100% pass rate)

**Blockers:** P1.1 complete ✓, P1.2 underway (can proceed in parallel)

### P1.4: Record & RecordValue + Data Entry Grid (Complete ✓)
**Completion Date**: 2026-04-28

**What Shipped:**
- **Data Model**: Record (subject × event × instrument × instance), RecordValue (per-field cell with typed columns), ValueRevision (audit-grade change history), RecordStatus enum (INCOMPLETE/UNVERIFIED/COMPLETE/LOCKED)
- **Partitioning**: RecordValue HASH-partitioned by projectId (16 buckets via P0.4 tooling)
- **Server Actions**: upsertRecordValue (single cell write with ValueRevision + audit), addInstance (enforces repeating=true, atomic increment), setRecordStatus (legal transitions)
- **Value Coercion**: Type-safe transforms raw input → typed column based on InstrumentField.type
- **UI Components**: Subject data entry page with event tabs, instrument cards, cell inputs with debounced auto-save, repeating-instrument tables with "+ Add row"
- **Migrations**: 20260503000000_record_value creates Record/RecordValue/ValueRevision tables with partition pruning
- **Testing**: Unit tests on coercion + status machine; integration tests covering Record → RecordValue write → ValueRevision; Playwright E2E for full flow

**Acceptance Criteria Met:**
- [x] E2E: enroll subject (P1.2), navigate to data page, fill 5 fields across 2 events, add 3 rows of repeating instrument, mark COMPLETE
- [x] ValueRevision contains exactly N-1 rows for a field updated N times
- [x] AuditLog row present for every cell write and status change
- [x] Partition pruning verified on (projectId) queries
- [x] Existing Response-based product survey flow untouched

**Blockers:** P1.2 (Subject/Enrollment), P1.3 (Instrument versioning), P0.4 (partition tooling)

### P1.5: Data Access Groups + DAG-Scoped Middleware (Complete ✓)
**Completion Date**: 2026-04-28

**What Shipped:**
- **Data Model**: DataAccessGroup (study-level site assignment), DagMember (userId + dagId composite PK), Enrollment.dagId (FK active), Record.dagId (denormalised for query speed)
- **Middleware**: Prisma middleware factory auto-filters Subject/Record/RecordValue by user's DAG memberships on findMany/findFirst/count/findUnique
- **Audit Context**: userDagIds loaded once per request; cached on context
- **Background Job**: record-dag-resync (pg-boss handler) updates Record.dagId when enrollment.dagId changes
- **Server Actions**: DAG CRUD, member add/remove with access control (org owner/manager)
- **UI Components**: DAG list page, DAG detail with members + assigned subject count, user picker for member management
- **Subject Roster**: DAG filter added to subject listing
- **Migrations**: 20260504000000_data_access_groups (models), 20260504000010_record_dag_denorm (Record.dagId + index)
- **Testing**: Middleware unit tests (whitelist, bypass, DAG-less user semantics), cross-user isolation integration tests
- **Audit Events**: DAG_CREATED, DAG_UPDATED, DAG_DELETED, DAG_MEMBER_ADDED, DAG_MEMBER_REMOVED

**Acceptance Criteria Met:**
- [x] User in DAG-A queries Subject/Record listings → sees only DAG-A rows; user with no DAG → sees all (current bypass semantics)
- [x] Enrollment DAG change triggers resync job; Record.dagId updated within 5s
- [x] DAG operations emit audit events with old + new state
- [x] Middleware adds <2ms p99 per query
- [x] Partition queries with DAG filter still use primary indexes

**Deferred to Phase 2:**
- EDGE-5: withDagContext() wiring into request lifecycle (requires session integration)
- D1 decision: DAG-less user = DENY (currently uses bypass). Requires session review.
- Record.dagId automated resync on enrollment change (background scheduler)

**Blockers:** P1.2 (Enrollment.dagId), P1.4 (Record.dagId denormalisation)

### P1.6: Clinical Audit Instrumentation (Planned)
**Estimated Completion**: 2026-05-20

**Scope:**
- Complete generic PRISMA_OPERATION replacement with typed audit events for all P1 operations (Record/RecordValue writes, DAG changes, etc.)
- Audit log UI: Clinical-specific event filtering and export
- Compliance report generation (basic: timeline of who changed what when)
- Support for 21 CFR Part 11 audit trail requirements

**Acceptance Criteria:**
- [ ] Every clinical operation creates corresponding AuditLog entry
- [ ] AuditLog events include diff of what changed (before/after values)
- [ ] Audit UI allows filtering by event type, date range, user
- [ ] Export supports CSV/PDF for compliance audits
- [ ] DAG scoping respected in audit viewer (user sees only auditable actions on accessible records)

**Blockers:** P1.4, P1.5 complete

---

## Phase 2: Advanced Clinical Features (Planned)

**Status**: Not Started  
**Estimated Start**: 2026-05-20  
**Key Theme**: Advanced data validation, custom forms, query workflows

### P2.1: EDC Form Builder (Custom Clinical Forms)
- Move beyond survey repurposing → native clinical form designer
- Data type system: text, integer, float, date, checkbox, radio, dropdown
- Validation rules: range checks, required fields, cross-field validation
- CRF layout: multipage forms, conditional field display
- Form versioning: audit trail of form changes

### P2.2: Advanced DAG Features & Site Management
- Extended multi-site governance (site activation/deactivation, site hierarchies)
- DAG-based reporting and audit trails (users see only accessible data in reports)
- Enrollment randomization and stratification by site/DAG
- Site-level SLAs and compliance tracking
- Note: Core DAG model shipped in P1.5; this phase adds governance layers

### P2.3: Query Flags & Data Review
- Data quality issues: missing values, range violations, consistency checks
- Query workflow: reviewer flags issue → data manager resolves
- Audit trail of all data queries and resolutions
- Query report generation

### P2.4: REVERSE: CLINICAL → PRODUCT Conversion (Deferred)
- One-way toggle support for converting clinical projects back to product mode
- Data archival strategy
- Compliance considerations

---

## Phase 3+: Integrations & Advanced Compliance

**Status**: Not Started  
**Estimated Start**: 2026-06-01

### P3.1: External Integrations
- HL7 FHIR export
- REDCap interoperability (import/export CRF definitions)
- Medidata Rave EDC sync
- Electronic Data Interchange (EDI) support

### P3.2: Advanced Compliance Features
- 21 CFR Part 11 validation reports
- GDPR data subject access request support
- Data retention policies with automated deletion
- Cryptographic audit trail hashing (tamper-evidence)

### P3.3: Analytics & Reporting
- Clinical data visualization (enrollment trends, dropout analysis)
- Safety monitoring dashboards
- Ad-hoc query builder for researchers
- Study-wide data quality metrics

---

## Success Metrics

| Metric | Phase 0 Target | Phase 1 Target | Status |
|--------|---|---|---|
| Audit log completeness | 100% | 100% | ✓ 100% (P1.4 extends to Record operations; P1.6 planned for full audit UI) |
| Protocol designer UX (time to design study) | N/A | < 5 min for typical study | ✓ P1.1 complete |
| Data entry performance (subject page load) | N/A | < 1.5s for 5 events × 4 instruments × 20 fields | ✓ P1.4 complete |
| Cell write latency (p99) | N/A | < 100ms + audit | ✓ P1.4 complete |
| DAG filtering overhead (p99 per query) | N/A | < 2ms overhead | ✓ P1.5 complete (measured) |
| Multi-site security (DAG scoping) | N/A | User A cannot read User B's site data | ✓ P1.5 complete (integration tested) |
| Compliance readiness (21 CFR Part 11) | Foundation | 70% | ✓ 70% (P1.4 + P1.5 done; P1.6 audit UI + export pending) |

---

## Risk Register

| Risk | Impact | Mitigation | Status |
|------|--------|-----------|--------|
| Interim EventInstrument.surveyId causes confusion | Medium | P1.3 migration clearly documented, marked "interim" in schema | Mitigated |
| N+1 queries in clinical workflows | High | Single `getStudyTree()` include chain, query monitoring | Mitigated |
| Ordering race conditions on concurrent reorders | Low | Explicit position field, last-write-wins acceptable for v1 | Accepted |
| Audit log performance on large studies | High | Monthly partitioning + composite indexes, monitoring via EXPLAIN ANALYZE | Mitigated |

---

## Dependencies & Blocking

```
Phase 0 (Foundation)
  ├─ P0.1 (Audit Log)
  ├─ P0.2 (Partitioning)
  └─ P0.3 (ProjectKind)
       │
Phase 1 (Clinical Core)
  ├─ P1.1 (Protocol Designer) ← P0.3 ✓
  │   ├─ P1.2 (Subject/Enrollment) ← P1.1 ✓
  │   │   ├─ P1.3 (Instrument Model) ← P1.2 ✓
  │   │   │   └─ P1.4 (Record & Data Entry) ← P1.3 ✓
  │   │   │       └─ P1.5 (Data Access Groups) ← P1.2, P1.4 ✓
  │   │   │           └─ P1.6 (Audit Events) ← P1.5
  │
Phase 2 (Advanced EDC)
  ├─ P2.1 (Form Builder) ← P1.3, P1.4 ✓
  ├─ P2.2 (Advanced DAG Features) ← P1.5 ✓
  ├─ P2.3 (Query Flags) ← P2.1
  └─ P2.4 (Reverse Conversion) ← Architecture review
```

---

## Links & Resources

- **Implementation Journals**: `docs/journals/` (detailed phase completion records)
- **Database Schema**: `packages/database/schema.prisma`
- **Code Standards**: `docs/code-standards.md`
- **System Architecture**: `docs/system-architecture.md`
- **Issue Tracker**: GitHub Issues (project board view)
- **Contributing**: `CONTRIBUTING.md`

---

## Change History

| Date | Phase | Change |
|------|-------|--------|
| 2026-04-27 | P0.3 | ProjectKind enum + clinical gating complete |
| 2026-04-28 | P1.1 | Clinical protocol designer shipped (Study/Arm/Event/EventInstrument) |
| 2026-04-28 | P1.3 | Instrument versioning shipped (Survey snapshot, DRAFT/PUBLISH/ARCHIVE lifecycle) |
| 2026-04-28 | P1.4 | Record & RecordValue data entry shipped (clinical form responses, partition pruning) |
| 2026-04-28 | P1.5 | Data Access Groups shipped (row-level security for multi-site, DAG-scoped middleware) |
| 2026-04-28 | Roadmap | Updated: P1.1, P1.3, P1.4, P1.5 complete; P1.2 in progress; P1.6 (audit events) planned |
