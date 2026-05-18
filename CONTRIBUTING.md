# Contributing to Continium

Thank you for your interest in contributing to Continium. This project exists to give the clinical research community a modern, open source alternative to proprietary EDC systems — and community contributions are essential to making that vision real.

Whether you are a software developer, a clinical data manager, a biostatistician, or a researcher who has encountered a frustrating limitation in existing tools, there is a place for you here.

---

## Ways to Contribute

### Bug Reports

If you encounter a bug — an incorrect calculation, a broken form, unexpected data export behavior, or anything else — please [open an issue](https://github.com/ntluong95/continium/issues/new/choose).

A helpful bug report includes:

- A clear description of what happened versus what you expected.
- Steps to reproduce the issue reliably.
- Your deployment environment (Docker version, browser, operating system).
- The Continium version or commit hash.
- Screenshots, error logs, or network traces where relevant.

### Feature Requests

Clinical trial workflows are complex and varied. If Continium is missing something your study needs, open an issue tagged `enhancement`. Explain:

- The clinical or research workflow that motivates the request.
- How you currently work around the limitation.
- Any REDCap, OpenClinica, or other EDC features that serve as a reference point.

We prioritize features that broadly benefit clinical research workflows, align with regulatory requirements, or improve data integrity and auditability.

### Documentation

Clear documentation is critical in a domain where misconfigured software can affect data quality and regulatory compliance. Improvements to setup guides, instrument design tutorials, validation documentation templates, and API references are always welcome.

### Pull Requests

We actively welcome code contributions. Before writing a large pull request, open an issue to discuss the approach — this avoids duplicated effort and ensures the implementation aligns with the project's architecture and regulatory considerations.

---

## Development Workflow

### Prerequisites

- [Node.js](https://nodejs.org/en) >= 20.18.1
- [Pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) — for PostgreSQL and supporting services

### Setup

```bash
git clone https://github.com/ntluong95/continium.git
cd continium/continium
pnpm install
cp .env.example .env   # configure your local environment
pnpm dev
```

See [`run_app.md`](./run_app.md) for the full local development guide.

### Coding Standards

- TypeScript throughout — no `any` types without justification.
- Follow the existing file structure in `apps/web` and `packages/`.
- Keep individual files under 200 lines; extract utilities and services into focused modules.
- No comments that explain *what* the code does — only *why* when the reason is non-obvious.
- Run `pnpm lint` and `pnpm test` before opening a pull request.

### Clinical Data Considerations

Continium handles sensitive research data. When contributing features that touch data storage, access control, or audit logging, keep the following in mind:

- **Audit trails must be preserved.** Never implement a change that allows data modification without a logged record of who changed what and when.
- **Access control is not optional.** Any new data endpoint must be protected by role-based access checks appropriate to the study role model (PI, coordinator, data manager, monitor, read-only).
- **Validation rules must be enforced server-side.** Client-side validation is a UX aid, not a data integrity control.
- **Consider 21 CFR Part 11 implications** for any feature touching electronic records or signatures.

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add branching logic for conditional form display
fix: correct date validation for ISO 8601 format
docs: update Docker deployment guide for PostgreSQL 16
refactor: extract audit trail logger into shared package
```

Do not reference AI tools in commit messages.

### Pull Request Process

1. Fork the repository and create a feature branch from `main`.
2. Write or update tests for any changed behavior.
3. Ensure `pnpm lint` and `pnpm test` pass.
4. Open a pull request against `main` with a clear description of the change and its motivation.
5. A maintainer will review within a reasonable timeframe. Regulatory or security-sensitive changes receive additional scrutiny.

---

## Regulatory and Compliance Contributions

Contributions that improve Continium's alignment with FDA 21 CFR Part 11, ICH-GCP, HIPAA, or other applicable frameworks are especially valued. If you have expertise in clinical data management or regulatory compliance, consider contributing:

- Validation documentation templates (IQ/OQ/PQ)
- Audit trail enhancements
- Electronic signature workflows
- Data export formats required by regulatory agencies

Open a discussion before starting significant compliance-related work so we can coordinate across the community.

---

## Code of Conduct

All contributors are expected to follow our [Code of Conduct](./CODE_OF_CONDUCT.md). Clinical research is built on trust — that extends to the communities that build the tools researchers rely on.

---

## Questions

For questions about contributing, open a [GitHub Discussion](https://github.com/ntluong95/continium/discussions). For security-related concerns, follow the process in [`SECURITY.md`](./SECURITY.md).
