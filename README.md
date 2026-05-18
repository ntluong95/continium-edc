<div id="top"></div>

<p align="center">
<a href="https://github.com/ntluong95/continium">
<img width="120" alt="Continium EDC - Open Source Electronic Data Capture for Clinical Trials" src="https://github.com/continium/continium/assets/72809645/0086704f-bee7-4d38-9cc8-fa42ee59e004">
</a>

<h3 align="center">Continium</h3>

<p align="center">
Open Source Electronic Data Capture for Clinical Trials
<br />
<a href="https://github.com/ntluong95/continium">Repository</a> ·
<a href="https://github.com/ntluong95/continium/issues">Issues</a> ·
<a href="https://github.com/ntluong95/continium/discussions">Discussions</a>
</p>
</p>

<p align="center">
<a href="https://github.com/ntluong95/continium/blob/main/continium/LICENSE"><img src="https://img.shields.io/badge/License-AGPL-purple" alt="License"></a>
<a href="https://github.com/ntluong95/continium/stargazers"><img src="https://img.shields.io/github/stars/ntluong95/continium?logo=github" alt="Github Stars"></a>
<a href="https://github.com/ntluong95/continium/issues?q=is:issue+is:open+label:%22help+wanted%22"><img src="https://img.shields.io/badge/Help%20Wanted-Contribute-blue" alt="Help Wanted"></a>
</p>

<br/>

## About Continium

Continium is an open source **Electronic Data Capture (EDC)** platform designed specifically for clinical trials and biomedical research. Built as a fork of [Formbricks](https://github.com/formbricks/formbricks) and inspired by [REDCap](https://projectredcap.org/), Continium brings modern web technology to the data collection workflows that researchers and clinical trial coordinators rely on every day.

Where REDCap pioneered self-hosted, researcher-friendly EDC and Formbricks provides a modern open source form infrastructure, Continium combines both philosophies: **clinical-grade data integrity** with a **contemporary developer experience**.

### Why Continium?

Clinical data collection tools often lag behind the broader software ecosystem. Continium aims to close that gap by offering:

- A modern, intuitive interface that reduces training time for site staff
- Self-hostable deployment to keep patient data within your institution's infrastructure
- Regulatory-aligned workflows for studies subject to FDA 21 CFR Part 11, ICH-GCP, and HIPAA
- An open source codebase that institutions can audit, extend, and contribute to

### Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Self-hosted Version](#self-hosted-version)
- [Development](#development)
- [Contribution](#contribution)
- [Security](#security)
- [License](#license)

<a id="features"></a>

### Features

- **Instrument Builder** — Design case report forms (CRFs) with a no-code editor supporting text, numeric, date, calculated, radio, checkbox, dropdown, and file upload field types.

- **Visit Scheduling** — Define study arms, visit windows, and form completion requirements per visit.

- **Data Validation** — Configure field-level and cross-form validation rules to catch entry errors at the source.

- **Audit Trail** — Automatic, tamper-evident logging of every data change with user, timestamp, and reason for change — aligned with 21 CFR Part 11 requirements.

- **Role-Based Access Control** — Assign granular permissions per study: principal investigator, coordinator, data manager, monitor, and read-only reviewer.

- **Multi-Site Support** — Manage multiple enrolling sites from a single instance with site-scoped data visibility.

- **Branching Logic** — Show or hide fields and forms dynamically based on participant responses.

- **Export & Reporting** — Export data to CSV, SPSS-compatible formats, and structured JSON for downstream statistical analysis.

- **Self-Hostable** — Deploy within your institution's firewall using Docker so your study and patient data can remain within your infrastructure. Note: self-hosted deployments may still send limited product telemetry/analytics or operational metadata unless those integrations are disabled; for regulated deployments, review the project's telemetry settings and disable them via the documented environment variables before production use.

- **Open Source** — Fully auditable AGPLv3 codebase.

### Built on Open Source

- [TypeScript](https://www.typescriptlang.org/)
- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Prisma](https://prisma.io/)
- [Auth.js](https://authjs.dev/)
- [Zod](https://zod.dev/)
- [Vitest](https://vitest.dev/)

<a id="getting-started"></a>

## Getting Started

<a id="self-hosted-version"></a>

### Self-Hosting Continium

Continium is designed for institutional self-hosting so that patient and research data stays within your organization's infrastructure.

#### Prerequisites

- [Node.js](https://nodejs.org/en) (Version: >=20.18.1)
- [Pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) — to run PostgreSQL and supporting services

#### Docker

```bash
git clone https://github.com/ntluong95/continium.git
cd continium/continium
cp .env.example .env   # fill in required environment variables
docker compose up -d
```

For a step-by-step setup guide, see [`run_app.md`](./run_app.md).

## Development

### Local Setup

```bash
git clone https://github.com/ntluong95/continium.git
cd continium/continium
pnpm install
pnpm dev
```

For a step-by-step local development guide see [`run_app.md`](./run_app.md).

<a id="contribution"></a>

## Contribution

Contributions are welcome and encouraged. Clinical informatics is a domain where open collaboration leads to better outcomes for researchers and, ultimately, for study participants.

Ways to contribute:

- **Bug reports** — Open an issue describing the problem, reproduction steps, and your environment.
- **Feature requests** — Open an issue tagged `enhancement`. Explain the clinical or research workflow that motivates the request.
- **Pull requests** — See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the development workflow and coding standards.
- **Documentation** — Improvements to guides, API docs, and deployment documentation are always valued.

## All Thanks To Our Contributors

<a href="https://github.com/ntluong95/continium/graphs/contributors">
<img src="https://contrib.rocks/image?repo=ntluong95/continium" />
</a>

## Acknowledgements

Continium is a fork of [Formbricks](https://github.com/formbricks/formbricks), whose open source infrastructure made this project possible. The design philosophy and feature priorities are heavily inspired by [REDCap](https://projectredcap.org/), the gold standard for academic and clinical research data capture.

<a id="security"></a>

## Security

Patient and research data security is a core requirement, not an afterthought. If you discover a security vulnerability, please disclose it responsibly by emailing [security@continium.dev](mailto:security@continium.dev) or opening a [GitHub Security Advisory](https://github.com/ntluong95/continium/security/advisories/new). Do not open a public issue for security reports.

See [`SECURITY.md`](./SECURITY.md) for the full vulnerability reporting policy.

<a id="license"></a>

## License

### Continium Core

The Continium core is licensed under the [GNU Affero General Public License v3.0 (AGPLv3)](./LICENSE). You may use, modify, and self-host the software freely, provided that any modifications you deploy over a network are also released under AGPLv3.

### Upstream Attribution

Continium is a derivative work of Formbricks (AGPLv3). The original Formbricks copyright and license notices are preserved throughout the codebase as required by the AGPLv3.

### Enterprise Features

Additional functionality located under `apps/web/modules/ee/` is licensed separately under a commercial Enterprise License. See [`apps/web/modules/ee/LICENSE`](./apps/web/modules/ee/LICENSE) for details.

See [`LICENSE.md`](./LICENSE.md) for a plain-language summary of all licensing terms.
