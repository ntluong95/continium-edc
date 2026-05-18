import * as Sentry from "@sentry/nextjs";
import { type Instrumentation } from "next";
import { isExpectedError } from "@continium/types/errors";

// Use process.env directly — instrumentation.ts is loaded by Turbopack before
// the Next.js @/ alias resolver is active. Importing from @/lib/constants causes
// MODULE_UNPARSABLE ("file not found") at startup.
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const PROMETHEUS_ENABLED = process.env.PROMETHEUS_ENABLED === "1";
const SENTRY_DSN = process.env.SENTRY_DSN;

export const onRequestError: Instrumentation.onRequestError = (...args) => {
  const [error] = args;

  // Skip expected business-logic errors (AuthorizationError, ResourceNotFoundError, etc.)
  // These are handled gracefully in the UI and don't need server-side Sentry reporting
  if (error instanceof Error && isExpectedError(error)) {
    return;
  }

  Sentry.captureRequestError(...args);
};

export const register = async () => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Load OpenTelemetry instrumentation when Prometheus metrics or OTLP export is enabled
    if (PROMETHEUS_ENABLED || process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
      await import("./instrumentation-node");
    }
  }
  // Sentry init loads after OTEL to avoid TracerProvider conflicts
  // Sentry tracing is disabled (tracesSampleRate: 0) -- SigNoz handles distributed tracing
  if (process.env.NEXT_RUNTIME === "nodejs" && IS_PRODUCTION && SENTRY_DSN) {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge" && IS_PRODUCTION && SENTRY_DSN) {
    await import("./sentry.edge.config");
  }
};
