# Security Policy

Continium handles clinical research data that may include protected health information (PHI) and sensitive trial data. We take security extremely seriously. If you discover a vulnerability, please follow the responsible disclosure process below.

For private reports, email [security@continium.dev](mailto:security@continium.dev). For non-sensitive security questions, open a GitHub Discussion.

---

## Introduction

Continium is built for environments subject to regulatory frameworks including FDA 21 CFR Part 11 (electronic records and signatures), ICH-GCP, and HIPAA. Security is not only a technical concern but a regulatory obligation. Our policy reflects this by prioritizing data integrity, access control, audit trails, and timely vulnerability remediation.

---

## I. Third-Party Dependency Policy

All third-party libraries and integrations are subject to:

- Vetting for adherence to our data usage and privacy standards before adoption.
- Continuous monitoring via automated dependency scanning (Dependabot / equivalent).
- Immediate action when a dependency is found to deviate from agreed data practices or introduces a known vulnerability.

We do not integrate third-party analytics, telemetry, or tracking services that transmit research data off-premises without explicit institutional consent.

---

## II. Annual Penetration Testing

To validate our security posture, Continium undergoes:

- Annual penetration testing conducted by an independent third party.
- Immediate prioritization and remediation of critical and high-severity findings.
- Internal review of results shared with relevant stakeholders.

Institutions deploying Continium for regulated trials are encouraged to conduct their own penetration tests and configuration reviews as part of their validation activities.

---

## III. Regulatory Alignment

Continium implements controls relevant to the following frameworks:

| Framework | Relevant Controls |
|---|---|
| FDA 21 CFR Part 11 | Audit trails, electronic signature workflows, access control |
| ICH E6(R2) GCP | Data integrity, traceability, role-based access |
| HIPAA Security Rule | Encryption in transit and at rest, access logs, minimum necessary access |
| NIST SP 800-53 | Identification & authentication, audit & accountability, system protection |

Compliance is a shared responsibility between the Continium project and the deploying institution. Continium provides the technical controls; institutions are responsible for operational policies, SOPs, and validation documentation.

---

## IV. Vulnerability Reporting and Management

Please do not use attacks on physical security, social engineering, distributed denial of service, spam, or third-party applications when testing.

### A. When to Report

Report a vulnerability if:

- You identify a potential security flaw in Continium's application code, infrastructure templates, or dependencies.
- You are uncertain whether a behavior constitutes a vulnerability.
- You find a vulnerability in a project Continium depends on that affects our users.
- You observe behavior that should be access-restricted but is not.

### B. When Reporting Is Not Needed

Do not file a security report if:

- You need help hardening your Continium deployment — open a GitHub Discussion instead.
- The concern is a general configuration question unrelated to a vulnerability.
- The issue is not security-related.

### C. Reporting Procedure

> Do not disclose the vulnerability publicly until it has been resolved.

1. **Submit a report** via one of the following channels:
   - [GitHub Security Advisory](https://github.com/ntluong95/continium/security/advisories/new) (preferred — private by default)
   - Email: [security@continium.dev](mailto:security@continium.dev)

   Include:
   - A clear description of the vulnerability and its potential impact.
   - Step-by-step reproduction instructions, with screenshots or a proof-of-concept if applicable.
   - Affected version(s) or commit range.
   - Any known mitigations.
   - Your preferred contact method for follow-up.

2. **Acknowledgement**: The security team will acknowledge receipt within **48 hours** and provide an initial assessment within **5 business days**.

3. **Remediation timeline**: Fixes are typically deployed within **7–28 days** depending on severity and complexity. Critical vulnerabilities affecting data integrity or patient privacy are treated as the highest priority.

4. **Ongoing communication**: A maintainer may contact you for additional details. We appreciate your patience as we verify and address reported issues.

---

### Reporter Protections

If you follow this policy:

- We will not pursue legal action against you in connection with your report.
- We will handle your report with strict confidentiality and will not share your personal details without your permission.
- We will keep you informed of remediation progress.
- We will credit you as the discoverer in the public disclosure (unless you prefer anonymity).

---

## V. Data Breach Response

In the event of a confirmed breach involving research or patient data:

1. The affected deployment administrator must be notified within 24 hours of confirmation.
2. Guidance on regulatory notification obligations (e.g., HIPAA Breach Notification Rule, IRB reporting) will be provided where possible, but institutional compliance teams bear responsibility for regulatory reporting.
3. A post-incident report will be published for vulnerabilities that affect the Continium codebase itself.

---

We are grateful to every researcher, clinician, and developer who helps us maintain a secure platform for clinical data. Your responsible disclosure protects study participants and the integrity of the science.
