You are a senior full-stack software architect and database migration engineer.

I have already completed a REDCap core database audit. The legacy system is REDCap/PHP/MySQL. I now want to design and build a modern open-source REDCap-like research data capture platform using the following stack:

- TypeScript
- Next.js
- React
- TailwindCSS
- Prisma
- Auth.js
- Zod
- Vitest

The target architecture should be inspired by modern open-source platforms such as Formbricks, but adapted for REDCap-like clinical research, survey, longitudinal study, access control, audit, and compliance workflows.

I will provide the following inputs:
1. REDCap migration audit document
2. REDCap database DDL SQL file
3. REDCap table inventory file

Your task is to transform the REDCap database infrastructure into a modern application architecture and implementation plan.

Please complete the following tasks.

---

## 1. Understand the Existing REDCap Core Database

Review the provided REDCap schema, audit report, and table inventory.

Identify and group all tables into clear functional domains, including but not limited to:

- System configuration
- Users and authentication
- Roles and permissions
- Projects
- Project metadata
- Instruments/forms
- Events and arms
- Longitudinal project logic
- Repeating instruments and events
- Record data
- Surveys
- Survey participants
- Survey responses
- Survey invitations and scheduling
- Data Access Groups
- Reports and dashboards
- Data quality rules
- Audit logs
- File/document storage
- E-consent
- API tokens and integrations
- External modules
- EHR/FHIR integration
- MyCap/mobile functionality
- Notifications and messaging
- Cron/background jobs

For each domain, explain:
- What the legacy tables do
- Which tables are essential for a minimum viable product
- Which tables can be postponed
- Which tables are legacy-specific and should not be copied directly
- Which tables should be redesigned into cleaner modern models

Clearly separate:
- Confirmed findings from the SQL/schema
- Inferred behavior
- Assumptions that require validation

---

## 2. Design a Modern Domain Architecture

Design a clean modular architecture for the new platform using TypeScript and Next.js.

Recommended modules may include:

- Identity and Access
- Organizations / Workspaces
- Projects
- Forms / Instruments
- Fields / Variables
- Branching Logic
- Events / Arms
- Records
- Survey Engine
- Participants
- Invitations
- Responses
- Permissions / RBAC
- Data Access Groups
- Audit Trail
- Reports
- Data Quality
- File Storage
- E-consent
- Background Jobs
- Integrations
- Admin / System Configuration

For each module, provide:
- Purpose
- Main entities
- API boundaries
- Key services
- Suggested folder structure
- Relationship to legacy REDCap tables
- Migration priority

Use a Formbricks-like architecture where appropriate:
- App Router structure
- Shared packages
- Reusable UI components
- Server-side services
- Repository/data-access layer
- Prisma-based persistence
- Zod-based validation
- Auth.js-based authentication
- Vitest-based testing

---

## 3. Create the Target Database Design

Using the REDCap core schema as input, design a modern relational schema suitable for Prisma.

Do not simply copy all REDCap tables one-to-one.

Instead:
- Preserve important concepts and IDs where needed for migration
- Normalize unclear or duplicated structures
- Replace dynamic table patterns with cleaner abstractions
- Keep audit and compliance requirements intact
- Maintain support for longitudinal projects, repeating instruments, surveys, and user permissions

For each proposed Prisma model, provide:

- Model name
- Purpose
- Important fields
- Primary key
- Unique constraints
- Relations
- Legacy REDCap source tables
- Migration notes

Pay special attention to these REDCap concepts:
- `redcap_projects`
- `redcap_metadata`
- `redcap_metadata_temp`
- `redcap_forms`
- `redcap_events_arms`
- `redcap_events_metadata`
- `redcap_events_forms`
- `redcap_events_repeat`
- `redcap_data`, `redcap_data2` ... `redcap_data6`
- `redcap_surveys`
- `redcap_surveys_participants`
- `redcap_surveys_response`
- `redcap_user_information`
- `redcap_auth`
- `redcap_user_rights`
- `redcap_user_roles`
- `redcap_data_access_groups`
- `redcap_reports`
- `redcap_data_quality_rules`
- `redcap_log_event*`
- `redcap_edocs_metadata`
- `redcap_esignatures`

Deliver:
1. Proposed Prisma schema
2. ERD summary
3. Legacy-to-modern table mapping
4. List of models for MVP
5. List of models for later phases

---

## 4. Define the MVP Scope

Design a realistic first version of the application.

The MVP should support:

- User login using Auth.js
- Workspace or organization management
- Project creation
- Form/instrument builder
- Field/variable metadata management
- Basic branching logic
- Basic record creation and editing
- Survey creation from an instrument
- Participant invitation links
- Survey response capture
- Role-based project permissions
- Data Access Groups
- Basic export
- Audit logging
- Basic reports

Clearly define what is excluded from MVP, such as:
- Full REDCap external module compatibility
- MyCap
- EHR/FHIR
- Advanced randomization
- Advanced e-consent
- Advanced data quality engine
- Full cron and scheduler compatibility
- Full REDCap API compatibility

For each MVP feature, provide:
- User story
- Required database models
- API routes/server actions
- UI screens
- Validation rules
- Test cases

---

## 5. Recommend Next.js Project Structure

Propose a clean repository structure using a modern open-source style.

Example target structure:

```txt
/apps
  /web
    /app
    /components
    /features
    /lib
    /server
    /styles

/packages
  /database
    prisma.schema
    migrations
    seed.ts

  /auth
  /ui
  /validation
  /types
  /config
  /logger
  /test-utils
```

For each folder, explain:

What belongs there
What should not belong there
How it connects to Prisma, Auth.js, Zod, and the UI
6. Design API and Service Layers

Create a clean service architecture.

For each major domain, define:

Server actions or API routes
Service functions
Repository/data-access functions
Zod input schemas
Authorization checks
Audit log events
Vitest test cases

Important domains:

Auth
Projects
Forms
Fields
Records
Surveys
Participants
Responses
Permissions
Reports
Audit logs

For each route or action, specify:

Name
Input
Output
Zod schema
Required permission
Database models touched
Audit event created
Error cases
7. Design Authorization and Permission Logic

Translate REDCap-style permission concepts into a modern RBAC/ABAC model.

Include support for:

System admin
Organization admin
Project owner
Project designer
Data entry user
Data viewer
Survey manager
Report viewer
Data export permission
DAG-restricted user
Read-only user

Explain how to model:

User roles
Project-level permissions
Form-level permissions
Record-level access
Data Access Groups
Export rights
Audit visibility

Provide:

Prisma models
Permission-checking functions
Example TypeScript authorization helpers
Test cases for permission boundaries
8. Design Form Builder and Metadata Model

REDCap stores project fields and instruments in metadata tables. Redesign this into a modern form builder model.

Support field types such as:

Text
Notes
Number
Date
Time
DateTime
Radio
Checkbox
Dropdown
Yes/No
True/False
File upload
Descriptive text
Calculated field
Slider
Signature
Section header

For each field type, define:

Prisma representation
Zod validation
React component
Storage format
Export format
Compatibility with legacy REDCap metadata

Also design support for:

Variable names
Field labels
Choices/options
Validation types
Required fields
Branching logic
Calculated fields
Matrix groups
Repeating instruments
9. Design Record and Response Storage

REDCap stores data in dynamic EAV-like tables such as redcap_data and additional partitioned tables.

Design a modern record storage approach.

Compare these options:

EAV-style storage
JSONB response storage
Fully relational generated tables
Hybrid model

Recommend the best approach for this project.

The recommendation should consider:

Query performance
Export performance
Auditability
Flexibility of form changes
Longitudinal projects
Repeating instruments
Data validation
Migration from REDCap
Prisma compatibility
DBeaver visibility

Provide:

Proposed Prisma models
Example query patterns
Example record save flow
Example survey response flow
Audit log design
Migration strategy from redcap_data*
10. Create Migration Strategy

Create a phased migration plan from REDCap/PHP/MySQL to the modern platform.

Include:

Phase 1: Schema understanding and compatibility layer
Freeze REDCap schema contract
Map legacy tables to new models
Create Prisma schema
Create seed data
Validate relationships
Phase 2: Identity, projects, and metadata
Migrate users
Migrate projects
Migrate forms/instruments
Migrate fields/metadata
Migrate events/arms
Phase 3: Records and surveys
Migrate records
Migrate survey definitions
Migrate participants
Migrate responses
Validate exports against legacy REDCap
Phase 4: Permissions and audit
Migrate roles
Migrate user rights
Migrate DAGs
Migrate audit logs
Phase 5: Reports, data quality, and advanced modules
Migrate reports
Migrate data quality rules
Migrate e-consent
Migrate files/documents
Migrate integrations only if needed
Phase 6: Cutover
Shadow-read validation
Dual-write testing if applicable
Export comparison
User acceptance testing
Production cutover

For each phase, provide:

Scope
Deliverables
Risks
Tests
Rollback strategy
11. Generate Initial Implementation Artifacts

Please generate the following starter artifacts:

Proposed Prisma schema for MVP
Zod schemas for core models
Auth.js configuration outline
Next.js route structure
Example server actions
Example React/Tailwind components
Example Vitest test cases
Example seed script
Example audit logger
Example permission-checking utility

Focus first on:

User
Organization
Project
Form
Field
Record
RecordValue
Survey
Participant
SurveyResponse
Role
Permission
DataAccessGroup
AuditLog
12. Engineering Standards

Follow these standards:

Use TypeScript strictly
Use Prisma for all database access
Use Zod for all input validation
Use Auth.js for authentication
Use TailwindCSS for UI styling
Use reusable React components
Use server-side authorization checks
Use Vitest for unit and integration tests
Use clear domain boundaries
Avoid leaking database logic into UI components
Avoid copying REDCap legacy table structure blindly
Preserve auditability and migration traceability
Include comments explaining REDCap compatibility decisions
13. Final Output Format

Please structure your response as:

A. Executive architecture summary
B. Legacy REDCap domain map
C. Proposed modern domain architecture
D. MVP scope
E. Proposed repository structure
F. Prisma schema draft
G. Legacy-to-modern table mapping
H. API/server-action design
I. Auth and permission model
J. Record and survey storage strategy
K. Migration roadmap
L. Testing strategy with Vitest
M. Risks and assumptions
N. Recommended next coding tasks

Important:

Do not expose secrets from the legacy REDCap project.
Do not suggest destructive migration steps.
Clearly separate confirmed schema facts from assumptions.
Optimize for a maintainable open-source architecture.
Prefer clean modern models over direct one-to-one legacy table replication unless compatibility requires it.