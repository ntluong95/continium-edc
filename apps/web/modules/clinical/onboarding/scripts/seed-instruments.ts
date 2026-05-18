#!/usr/bin/env tsx
/**
 * Seeds one demo clinical project per template into the database,
 * pre-creating all Arms, Events, Instruments, and InstrumentFields.
 *
 * Run: pnpm --filter web db:seed:clinical
 *
 * Idempotent: re-running skips templates whose study already has instruments.
 * Requires the seed org (SEED_IDS.ORGANIZATION) to exist — run `pnpm db:seed` first.
 *
 * Refuses to run when `NODE_ENV === "production"` unless `ALLOW_PROD_SEED=1`
 * is explicitly set. The script writes hardcoded demo IDs and is intended
 * for dev / test environments only; running it in production seeds demo
 * projects into a real org and the cleanup is manual.
 */

if (process.env.NODE_ENV === "production" && process.env.ALLOW_PROD_SEED !== "1") {
  console.error(
    "Refusing to run seed-instruments.ts in production. Set ALLOW_PROD_SEED=1 to override."
  );
  process.exit(1);
}

import { prisma } from "@continium/database";
import { clinicalTemplates } from "../lib/templates";

// Must match SEED_IDS.ORGANIZATION in packages/database/src/seed/constants.ts
const SEED_ORG_ID = "clseedorg0000000000000";

// Stable seed IDs — one project + study per template; must match constants.ts
const TEMPLATE_SEED_IDS: Record<string, { projectId: string; studyId: string }> = {
  classic_database:              { projectId: "clclinprojclassicdb000", studyId: "clclinstdyclassicdb000" },
  longitudinal_2_arms:           { projectId: "clclinprojlong2arms000", studyId: "clclinstdylong2arms000" },
  single_survey:                 { projectId: "clclinprojsnglsurvey00", studyId: "clclinstdysnglsurvey00" },
  longitudinal_1_arm:            { projectId: "clclinprojlong1arm0000", studyId: "clclinstdylong1arm0000" },
  basic_demography:              { projectId: "clclinprojbasicdemog00", studyId: "clclinstdybasicdemog00" },
  project_tracking:              { projectId: "clclinprojprojtrack000", studyId: "clclinstdyprojtrack000" },
  randomized_clinical_trial:     { projectId: "clclinprojrct000000000", studyId: "clclinstdyrct000000000" },
  cancer_tissue_biobank:         { projectId: "clclinprojcancerbbnk00", studyId: "clclinstdycancerbbnk00" },
  multiple_surveys_classic:      { projectId: "clclinprojmultisrvcls0", studyId: "clclinstdymultisrvcls0" },
  multiple_surveys_longitudinal: { projectId: "clclinprojmultisrvlng0", studyId: "clclinstdymultisrvlng0" },
  piping_example:                { projectId: "clclinprojpipingex0000", studyId: "clclinstdypipingex0000" },
  repeating_instruments:         { projectId: "clclinprojrptistr00000", studyId: "clclinstdyrptistr00000" },
  field_embedding:               { projectId: "clclinprojfldembdg000",  studyId: "clclinstdyfldembdg000" },
  dashboards_smart_charts:       { projectId: "clclinprojdashbrd00000", studyId: "clclinstdydashbrd00000" },
  mycap_example:                 { projectId: "clclinprojmycap000000",  studyId: "clclinstdymycap0000000" },
};

async function seedTemplate(
  projectId: string,
  studyId: string,
  template: (typeof clinicalTemplates)[number],
): Promise<void> {
  await prisma.project.upsert({
    where: { id: projectId },
    update: {},
    create: {
      id: projectId,
      name: `[Seed] ${template.name}`,
      organizationId: SEED_ORG_ID,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      kind: "CLINICAL" as any,
    },
  });

  await prisma.study.upsert({
    where: { projectId },
    update: {},
    create: { id: studyId, projectId, name: template.name },
  });

  await prisma.clinicalProjectOnboarding.upsert({
    where: { projectId },
    update: {},
    create: {
      projectId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      purpose: template.purpose as any,
      startMethod: "template",
      templateKey: template.key,
      completedAt: new Date(),
    },
  });

  const existingCount = await prisma.instrument.count({ where: { studyId } });
  if (existingCount > 0) {
    console.log(`  ↩ ${template.name}: already seeded (${existingCount} instruments)`);
    return;
  }

  let totalFields = 0;

  await prisma.$transaction(async (tx) => {
    const instrumentIdByKey = new Map<string, string>();

    for (const templateInstrument of template.instruments) {
      const instrument = await tx.instrument.create({
        data: {
          studyId,
          surveyId: null,
          version: 1,
          status: "PUBLISHED",
          name: templateInstrument.key,
          displayName: templateInstrument.displayName,
        },
        select: { id: true },
      });
      instrumentIdByKey.set(templateInstrument.key, instrument.id);

      if (templateInstrument.fields.length > 0) {
        await tx.instrumentField.createMany({
          data: templateInstrument.fields.map((field, idx) => ({
            instrumentId: instrument.id,
            key: field.key,
            label: field.label,
            type: field.type,
            required: field.required,
            position: field.position ?? idx,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            choicesJson: (field.choicesJson ?? null) as any,
          })),
        });
        totalFields += templateInstrument.fields.length;
      }
    }

    for (const [armIdx, templateArm] of template.arms.entries()) {
      const arm = await tx.arm.create({
        data: {
          studyId,
          name: templateArm.name.trim() || `Arm ${armIdx + 1}`,
          position: templateArm.position ?? armIdx,
        },
        select: { id: true },
      });

      const seenEventNames = new Set<string>();
      for (const [eventIdx, templateEvent] of templateArm.events.entries()) {
        let eventName = templateEvent.name;
        if (seenEventNames.has(eventName)) {
          eventName = `${eventName} (${eventIdx + 1})`;
        }
        seenEventNames.add(eventName);

        const event = await tx.event.create({
          data: {
            armId: arm.id,
            name: eventName,
            position: templateEvent.position ?? eventIdx,
            dayOffset: templateEvent.dayOffset ?? null,
            windowDays: templateEvent.windowDays ?? null,
          },
          select: { id: true },
        });

        const seenBindingKeys = new Set<string>();
        for (const binding of templateEvent.instrumentBindings) {
          if (seenBindingKeys.has(binding.instrumentKey)) continue;
          const instrumentId = instrumentIdByKey.get(binding.instrumentKey);
          if (!instrumentId) continue;
          seenBindingKeys.add(binding.instrumentKey);

          await tx.eventInstrument.create({
            data: {
              eventId: event.id,
              instrumentId,
              required: binding.required,
              repeating: binding.repeating,
            },
          });
        }
      }
    }
  });

  console.log(`  ✓ ${template.name}: ${template.instruments.length} instruments, ${totalFields} fields`);
}

async function main(): Promise<void> {
  console.log("Seeding clinical template instruments...\n");

  for (const template of clinicalTemplates) {
    const seedIds = TEMPLATE_SEED_IDS[template.key];
    if (!seedIds) {
      console.warn(`  ⚠ No seed IDs for template "${template.key}" — skipping`);
      continue;
    }
    await seedTemplate(seedIds.projectId, seedIds.studyId, template);
  }

  console.log("\nDone.");
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect().catch((e: unknown) => {
      console.error(e, "Error disconnecting prisma");
    });
  });
