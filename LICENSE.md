# Licensing

This document provides a plain-language summary of the licenses that apply to different parts of the Continium codebase. The full legal text of each license takes precedence over this summary.

---

## Continium Core — AGPLv3

The core Continium application is licensed under the **GNU Affero General Public License v3.0 (AGPLv3)**. See [`LICENSE`](./LICENSE) for the full text.

### What this means in practice

| You want to... | Permitted? | Conditions |
|---|---|---|
| Use Continium to run your own clinical trial | Yes | No conditions for private use |
| Self-host Continium within your institution | Yes | No conditions |
| Modify the source code for internal use | Yes | No conditions for private modifications |
| Deploy a modified version over a network (e.g., to study sites) | Yes | You must make the modified source code available under AGPLv3 |
| Distribute Continium or a fork | Yes | Must include the AGPLv3 license and copyright notices |
| Sell a hosted service built on Continium | Yes | Source code of modifications must be available to users |
| Include Continium code in a proprietary product | No | AGPLv3 requires the combined work to be AGPLv3 |

The AGPLv3 "network use" clause is the key distinction from the standard GPL: if you run a modified version of Continium as a service that others connect to, you must provide the source code of your modifications to those users.

---

## Upstream Attribution — Formbricks

Continium is a derivative work of [Formbricks](https://github.com/formbricks/formbricks), which is also licensed under AGPLv3. The original Formbricks copyright notices are preserved throughout the codebase. Formbricks retains copyright over the portions of the code that originate from their project.

---

## Enterprise Features — Commercial License

Code located under `apps/web/modules/ee/` is **not** part of the AGPLv3-licensed core. It is licensed under a separate **Continium Enterprise License**. See [`apps/web/modules/ee/LICENSE`](./apps/web/modules/ee/LICENSE) for the full terms.

Enterprise features are included in the standard Docker images but require a license key to activate. Contact the maintainers for enterprise licensing inquiries.

---

## SDK and Client Packages — MIT

Client libraries and SDKs located under `packages/js/`, `packages/android/`, `packages/ios/`, and `packages/api/` are licensed under the **MIT License** as defined in the `LICENSE` file within each respective package. This allows these packages to be freely integrated into applications regardless of their license.

---

## Third-Party Components

All third-party components incorporated into Continium are used under the license provided by the original copyright holder. A full dependency list with license information is available by running:

```bash
pnpm licenses list
```

---

## Regulatory and Validation Notice

The AGPLv3 license grants you freedom to use, study, modify, and distribute Continium. However, institutions deploying Continium in regulated environments (FDA 21 CFR Part 11, HIPAA, ICH-GCP) are responsible for their own validation activities, including Installation Qualification (IQ), Operational Qualification (OQ), and Performance Qualification (PQ) as required by applicable regulations. Continium provides an auditable, open source codebase to facilitate — but does not guarantee — regulatory compliance for any specific deployment.

---

## Questions

For licensing questions, open a [GitHub Discussion](https://github.com/ntluong95/continium/discussions) or email [info@continium.dev](mailto:info@continium.dev).
