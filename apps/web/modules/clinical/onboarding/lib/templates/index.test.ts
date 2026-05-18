import { describe, expect, test } from "vitest";
import { ZClinicalTemplate } from "../template-types";
import { clinicalTemplates } from "./index";

/**
 * Static load test: every committed template file must parse against the
 * runtime Zod schema. Catches drift between the template DSL and the schema
 * before a coordinator hits the failure mid-onboarding.
 *
 * Templates are static TS files (per the Q5 decision in
 * changes/refactor-pr-breakdown.md). This test is the safety net that
 * compensates for not having build-time generation.
 */
describe("clinical templates static Zod load", () => {
  test("exposes 15 templates", () => {
    expect(clinicalTemplates).toHaveLength(15);
  });

  test("every template has a unique key", () => {
    const keys = clinicalTemplates.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test.each(
    clinicalTemplates.map((template) => [template.key, template] as const)
  )("template %s parses against ZClinicalTemplate", (_key, template) => {
    const result = ZClinicalTemplate.safeParse(template);
    if (!result.success) {
      // Provide a readable failure surface — the Zod error tree is otherwise
      // hard to scan in a one-line test output.
      throw new Error(
        `Template ${template.key} failed schema: ${JSON.stringify(result.error.issues, null, 2)}`
      );
    }
    expect(result.success).toBe(true);
  });

  test("every instrument reference in arms.events.instrumentBindings exists", () => {
    for (const template of clinicalTemplates) {
      const instrumentKeys = new Set(template.instruments.map((i) => i.key));
      for (const arm of template.arms) {
        for (const event of arm.events) {
          for (const binding of event.instrumentBindings) {
            expect(
              instrumentKeys.has(binding.instrumentKey),
              `template ${template.key} arm "${arm.name}" event "${event.name}" references missing instrumentKey "${binding.instrumentKey}"`
            ).toBe(true);
          }
        }
      }
    }
  });

  test("every instrument field has a non-empty key + label", () => {
    for (const template of clinicalTemplates) {
      for (const instrument of template.instruments) {
        for (const field of instrument.fields) {
          expect(field.key.trim().length, `${template.key}.${instrument.key} field key`).toBeGreaterThan(0);
          expect(field.label.trim().length, `${template.key}.${instrument.key} field "${field.key}" label`).toBeGreaterThan(0);
        }
      }
    }
  });
});
