# REDCap 15.8.4 Database and Migration Audit (A-J)

## A) Connection and data access architecture

Primary connection/bootstrap flow:
- `database.php` stores host/db/user/password, optional SSL/TLS variables, and system salt.
- `redcap_connect.php` opens mysqli connection (optionally SSL), reads config from `redcap_config`, sets charset/collation/session SQL mode, and loads versioned config.
- `redcap_v15.8.4/Config/init_functions.php` provides the DB abstraction layer and read-replica behavior.

Key data-access functions:
- `db_connect`
- `db_query`
- `db_multi_query`
- `db_fetch_assoc`
- `db_num_rows`
- `db_result`
- `db_escape`/`db_real_escape_string`

Important characteristics:
- Mixed plain SQL + wrapper/prepared-style calls.
- Dynamic table routing in several flows (for example, `Records::getDataTable(...)` and log table indirection).
- Read replica support for selected read paths.

## B) Complete schema inventory summary

Canonical schema source:
- `redcap_v15.8.4/Resources/sql/install.sql`

Parsed inventory outputs (generated):
- Table list: `analysis_artifacts/redcap_tables.txt`
- Column inventory: `analysis_artifacts/redcap_table_columns.csv`
- FK edges: `analysis_artifacts/redcap_fk_edges.csv`
- Stats: `analysis_artifacts/redcap_schema_stats.txt`

Current baseline counts from install.sql:
- Total tables: 231
- Total parsed column rows: 2207
- Total FK edges: 180

## C) Table-by-table mapping deliverable

For exhaustive table-level mapping, use:
- `analysis_artifacts/redcap_table_columns.csv`
- `analysis_artifacts/redcap_fk_edges.csv`

These provide, per table:
- Column names and raw SQL definitions/types/defaults.
- Relationship edges with source/target table+column and ON DELETE/ON UPDATE behavior where parsed.

Representative high-impact table families:
- Core project and metadata: `redcap_projects`, `redcap_metadata`, `redcap_forms`, `redcap_events_arms`, `redcap_events_metadata`, `redcap_events_forms`, `redcap_events_repeat`.
- Record data: `redcap_data`, `redcap_data2`..`redcap_data6`, `redcap_record_list`, `redcap_record_counts`.
- Surveys: `redcap_surveys`, `redcap_surveys_participants`, `redcap_surveys_response`, scheduler/queue/email tables.
- Security/identity: `redcap_user_information`, `redcap_auth`, `redcap_user_rights`, `redcap_user_roles`, `redcap_data_access_groups`.
- Reporting/data quality: `redcap_reports*`, `redcap_data_quality_*`.
- Logging/audit: `redcap_log_event*`, `redcap_log_view*`.
- Extensions/integration: `redcap_external_modules*`, EHR/FHIR, MyCap, rewards, Twilio, Send-It.

## D) Business workflow-to-schema mapping

Authentication/user management:
- User and auth storage in `redcap_user_information` + `redcap_auth` with 2FA and API token handling.
- Control Center user creation/updating and security settings write into these tables.

Project lifecycle and design:
- Project creation writes to `redcap_projects`, then copies metadata/events/forms and related structures.
- Design workflows pivot between `redcap_metadata` and `redcap_metadata_temp` in draft/production transitions.

Data entry and record lifecycle:
- Core record values stored in `redcap_data*` tables with event/form/instance semantics.
- Auxiliary record surfaces and dashboards use `redcap_record_*` tables.

Survey runtime:
- Instrument-to-survey configuration in `redcap_surveys`.
- Participants in `redcap_surveys_participants`.
- Responses in `redcap_surveys_response`.
- Invitations/scheduling in `redcap_surveys_emails*`, `redcap_surveys_scheduler*`, `redcap_surveys_queue*`.

Permissions/governance:
- User-level rights in `redcap_user_rights`.
- Role templates in `redcap_user_roles`.
- DAG partitioning in `redcap_data_access_groups` and `redcap_data_access_groups_users`.

Reporting and data quality:
- Report definitions and access controls across `redcap_reports*`.
- Data quality rules/results/resolutions in `redcap_data_quality_rules`, `redcap_data_quality_status`, `redcap_data_quality_resolutions`.

Audit/compliance:
- Event audit in `redcap_log_event*` and `redcap_log_view*`.
- E-signatures and PDF snapshot/archive tables for compliant capture and archival.

## E) Inferred ER structure (domain-level)

Primary hubs:
- `redcap_projects` is the dominant parent for most project-scoped entities.
- `redcap_user_information` anchors user-centric actions, ownership, and auditing.
- `redcap_events_metadata` and `redcap_surveys` act as workflow pivots for longitudinal and survey subsystems.

Core chains:
- Project -> metadata/forms/events -> data rows.
- Survey -> participants -> responses -> scheduler queue/logs.
- Project -> user_rights + user_roles + DAGs -> access-filtered operations.
- Project -> reports + report access/filter tables.

## F) Visualization artifacts

Generated files:
- SQL DDL: `analysis_artifacts/redcap_schema.ddl.sql`
- DBML: `analysis_artifacts/redcap_schema.dbml`
- Mermaid ER: `analysis_artifacts/redcap_schema.mermaid`
- FK CSV (also useful for graph import): `analysis_artifacts/redcap_fk_edges.csv`

## G) Migration mapping to modern stack (TypeScript/Next.js/Prisma)

Recommended domain decomposition:
- Identity and Access: users, auth, 2FA, API keys, roles, DAGs.
- Project Design: project config, metadata/forms, events/arms, branching/display logic.
- Record Runtime: record CRUD, validation, locking/e-signatures, file links.
- Survey Engine: instruments-to-survey config, participants, responses, invitations/schedulers.
- Reporting and Analytics: report definitions, filters, access, dashboard folders.
- Data Quality: rule compiler/executor, issue status lifecycle, resolution comments/files.
- Integration and Extensions: external modules, EHR/FHIR, Twilio, MyCap, Send-It.
- Audit and Compliance: immutable audit/event logs and snapshot/archive stores.

Prisma strategy:
- Preserve legacy IDs and key unique constraints first.
- Model direct FK constraints from `redcap_fk_edges.csv`.
- Explicitly model dynamic/sharded table behavior (`redcap_dataN`, `redcap_log_eventN`) behind repository abstractions rather than exposing shards to business services.

## H) Migration risk and complexity hotspots

Highest-risk areas:
- Dynamic table selection and partitioned data/log tables.
- Legacy SQL patterns using implicit joins and broad ad hoc filtering.
- Tight coupling between survey runtime and record/event semantics.
- Draft-vs-production metadata dual-table behavior.
- Permission semantics split across user-level, role-level, and DAG-level filters.

Operational risk controls:
- Build compatibility adapters around existing query semantics first.
- Add golden-record fixtures per high-risk workflow.
- Use dual-write or shadow-read validation before cutover.

## I) Suggested phased migration plan

Phase 1: Inventory and contract lock
- Freeze schema contract from install + upgrades.
- Declare read-model contracts for core workflows.

Phase 2: Auth/access and project metadata
- Migrate user/auth/role/DAG and project+metadata read APIs.

Phase 3: Survey and record write paths
- Introduce transactional services for participant/response and record save flows.

Phase 4: Reporting/data quality/audit
- Port report builder and DQ lifecycle with equivalent ACL filters.

Phase 5: Integrations and extension boundaries
- Carve out EHR/MyCap/Twilio/external module adapters.

Phase 6: Cutover and decommission
- Dual-run verification, reconcile drift, then retire legacy write endpoints.

## J) Assumptions, caveats, and evidence policy

Assumptions:
- `install.sql` represents baseline canonical schema for this version.
- Upgrade scripts may mutate schema post-install and must be folded into final target model.
- Parsed CSV/DBML/Mermaid outputs are generated from the baseline SQL and may require manual refinement for edge SQL constructs.

Caveats:
- This audit is read-only and code-preserving.
- Example API files include placeholder-like token samples and should not be treated as active secrets.

Evidence posture:
- All structural counts and relationships in this artifact set are generated directly from repository SQL sources and wrapper/query call sites, not inferred from external docs.
