# @continium/licensing

Continium-owned licensing and entitlement layer. Original code; not derived from Formbricks Enterprise Edition.

## What this package does

- Defines the Continium clinical feature registry (`CONTINIUM_FEATURES`).
- Resolves entitlements from environment variables (`CONTINIUM_EDITION`, `CONTINIUM_DISABLED_FEATURES`).
- Provides a server-side guard (`assertContiniumFeatureEnabled`) that throws `ContiniumFeatureDisabledError` when a feature is off.
- Encodes compliance-locked features (`clinicalEdc`, `clinicalAuditLog`) that cannot be disabled via env.

## Usage

```ts
import {
  CONTINIUM_FEATURES,
  assertContiniumFeatureEnabled,
  readContiniumLicensingEnv,
  resolveContiniumEntitlements,
} from "@continium/licensing";

const env = readContiniumLicensingEnv(process.env);
const entitlements = resolveContiniumEntitlements(env);

// In a server action / route handler:
assertContiniumFeatureEnabled(entitlements, CONTINIUM_FEATURES.clinicalExports);
```

In the Continium web app, prefer the wrappers in `apps/web/modules/continium/licensing/`:

- `getContiniumEntitlements()` — cached per render
- `assertContiniumFeature(featureKey)` — server-side, throws if disabled
- `<FeatureGate feature="...">` — client-side display gate (never the sole guard for data access)

## Environment variables

| Variable                      | Default      | Description                                                                                                                                     |
| ----------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `CONTINIUM_EDITION`           | `selfHosted` | One of `free` \| `selfHosted` \| `cloud`. `cloud` is fail-closed in this package; the web app's cloud resolver overlays license-server results. |
| `CONTINIUM_DISABLED_FEATURES` | _(empty)_    | CSV of feature keys to disable. `clinicalEdc` and `clinicalAuditLog` are compliance-locked and rejected at boot.                                |

## License

AGPLv3. See `LICENSE`.
