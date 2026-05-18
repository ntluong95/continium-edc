/**
 * One-shot converter: REDCap demo SQL → Continium clinical templates.
 *
 * Reads `redcap/redcap_v15.8.4/Resources/sql/create_demo_db*.sql` and emits one
 * typed `ClinicalTemplate` TS file per template plus an `index.ts` barrel.
 * The 15 emitted TS files are committed; runtime never reads SQL.
 *
 * Run: pnpm tsx apps/web/modules/clinical/onboarding/scripts/convert-redcap-sql.ts
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = resolve(__dirname, "../../../../../../..");
const SQL_DIR = join(REPO_ROOT, "redcap/redcap_v15.8.4/Resources/sql");
const OUT_DIR = resolve(__dirname, "../lib/templates");

const TEMPLATE_KEY_BY_DB: Record<string, string> = {
  create_demo_db1: "classic_database",
  create_demo_db2: "longitudinal_2_arms",
  create_demo_db3: "single_survey",
  create_demo_db4: "longitudinal_1_arm",
  create_demo_db5: "basic_demography",
  create_demo_db6: "project_tracking",
  create_demo_db7: "randomized_clinical_trial",
  create_demo_db8: "cancer_tissue_biobank",
  create_demo_db9: "multiple_surveys_classic",
  create_demo_db10: "multiple_surveys_longitudinal",
  create_demo_db11: "piping_example",
  create_demo_db12: "repeating_instruments",
  create_demo_db13: "field_embedding",
  create_demo_db14: "dashboards_smart_charts",
  create_demo_db15: "mycap_example",
};

const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
  classic_database:
    "A single-arm clinical project with a baseline event and a demographics instrument. Good starting point for simple registries.",
  longitudinal_2_arms:
    "Two-arm longitudinal study with enrollment, multiple visits, lab data, and adverse-event tracking. Suitable for treatment comparison studies.",
  single_survey: "Lightweight single-instrument study for one-off questionnaires (no visit schedule).",
  longitudinal_1_arm:
    "One-arm longitudinal study with baseline, follow-ups, and final visit. Mirrors the canonical observational protocol.",
  basic_demography:
    "Minimal demographics-only protocol — useful for quick prototyping or capturing a demographics screening instrument.",
  project_tracking:
    "Project tracking workspace for operational milestones (status, contacts, notes). Operational use, not clinical data capture.",
  randomized_clinical_trial:
    "Fully randomized trial with baseline, dosing visits, lab/observation forms, and a closeout visit.",
  cancer_tissue_biobank: "Tissue biobank schema covering specimen tracking, pathology, and donor consent.",
  multiple_surveys_classic:
    "Several independent instruments served as classic surveys without a longitudinal visit schedule.",
  multiple_surveys_longitudinal:
    "Multi-instrument longitudinal study served as repeated surveys across visits.",
  piping_example:
    "Demonstrates field-piping concepts. Continium does not yet support REDCap-style piping; fields are created as plain inputs.",
  repeating_instruments:
    "Captures repeating data such as adverse-event logs. Continium supports repeating bindings on the EventInstrument level.",
  field_embedding:
    "Demonstrates REDCap-specific field embedding. Continium does not yet support field embedding; fields are created as plain inputs.",
  dashboards_smart_charts:
    "Demonstrates REDCap dashboards / smart functions / smart charts. Those features are not available in Continium; the protocol skeleton is created without them.",
  mycap_example:
    "Mobile/MyCap-style protocol skeleton. MyCap features are not available in Continium; the protocol skeleton is created without them.",
};

const TEMPLATE_PURPOSES: Record<string, string> = {
  classic_database: "research",
  longitudinal_2_arms: "research",
  single_survey: "operational_support",
  longitudinal_1_arm: "research",
  basic_demography: "practice",
  project_tracking: "operational_support",
  randomized_clinical_trial: "research",
  cancer_tissue_biobank: "research",
  multiple_surveys_classic: "operational_support",
  multiple_surveys_longitudinal: "research",
  piping_example: "practice",
  repeating_instruments: "research",
  field_embedding: "practice",
  dashboards_smart_charts: "practice",
  mycap_example: "practice",
};

const UNSUPPORTED_BY_KEY: Record<string, string[]> = {
  piping_example: ["Field piping (Continium renders plain fields instead)"],
  field_embedding: ["Field embedding"],
  dashboards_smart_charts: ["REDCap project dashboards", "Smart Functions / Smart Tables / Smart Charts"],
  mycap_example: ["MyCap mobile features"],
};

interface ParsedField {
  formName: string;
  fieldName: string;
  elementType: string;
  elementLabel: string;
  elementEnum: string | null;
  elementValidationType: string | null;
  branchingLogic: string | null;
  required: boolean;
  fieldOrder: number;
}

interface ParsedTemplate {
  title: string;
  arms: { armNum: number; armName: string }[];
  events: { armNum: number; descrip: string; dayOffset: number; offsetMin: number; offsetMax: number }[];
  eventForms: { eventIdx: number; formName: string }[];
  metadata: ParsedField[];
}

const stripBackslashEscapes = (s: string) => s.replace(/\\'/g, "'").replace(/\\\\/g, "\\");

const parseSqlFile = (filePath: string): ParsedTemplate => {
  const sql = readFileSync(filePath, "utf-8");
  const titleMatch = sql.match(/@project_title\s*=\s*'([^']+)'/);
  const title = titleMatch ? stripBackslashEscapes(titleMatch[1]) : "Untitled";

  const arms: ParsedTemplate["arms"] = [];
  for (const m of sql.matchAll(
    /INSERT INTO\s+redcap_events_arms[^()]*\(\s*[^)]+\)\s*VALUES\s*\(\s*@project_id\s*,\s*(\d+)\s*,\s*'([^']*)'\s*\)/gi
  )) {
    arms.push({ armNum: Number(m[1]), armName: stripBackslashEscapes(m[2]) });
  }
  if (arms.length === 0) arms.push({ armNum: 1, armName: "Arm 1" });

  // Walk the SQL in document order so we can correctly bind each
  // `redcap_events_forms` row to the most recently inserted event, even when
  // REDCap reuses `@event_id` across events.
  const events: ParsedTemplate["events"] = [];
  const eventForms: ParsedTemplate["eventForms"] = [];
  let currentEventIdx = -1;

  const eventMetadataRegex =
    /INSERT INTO\s+redcap_events_metadata[^()]*\(\s*[^)]+\)\s*VALUES\s*\(\s*([^,]+),\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*'([^']*)'\s*\)/gi;
  const eventFormsRegex =
    /INSERT INTO\s+redcap_events_forms[^()]*\(\s*[^)]+\)\s*VALUES\s*\(\s*([^,]+)\s*,\s*'([^']*)'\s*\)/gi;

  type Hit =
    | { kind: "metadata"; index: number; match: RegExpExecArray }
    | { kind: "forms"; index: number; match: RegExpExecArray };

  const hits: Hit[] = [];
  for (const m of sql.matchAll(eventMetadataRegex)) {
    hits.push({ kind: "metadata", index: m.index ?? 0, match: m as unknown as RegExpExecArray });
  }
  for (const m of sql.matchAll(eventFormsRegex)) {
    hits.push({ kind: "forms", index: m.index ?? 0, match: m as unknown as RegExpExecArray });
  }
  hits.sort((a, b) => a.index - b.index);

  for (const hit of hits) {
    if (hit.kind === "metadata") {
      const armRef = hit.match[1].trim();
      let armNum = 1;
      if (armRef === "@arm_id") {
        armNum = arms[0]?.armNum ?? 1;
      } else {
        const armSuffixMatch = armRef.match(/@arm_id(\d+)/);
        if (armSuffixMatch) {
          armNum = Number(armSuffixMatch[1]);
        }
      }
      events.push({
        armNum,
        dayOffset: Number(hit.match[2]),
        offsetMin: Number(hit.match[3]),
        offsetMax: Number(hit.match[4]),
        descrip: stripBackslashEscapes(hit.match[5]),
      });
      currentEventIdx = events.length - 1;
    } else {
      if (currentEventIdx < 0) continue;
      eventForms.push({
        eventIdx: currentEventIdx,
        formName: stripBackslashEscapes(hit.match[2]),
      });
    }
  }

  const metadata: ParsedField[] = [];
  // INSERT INTO redcap_metadata (...) VALUES (...) — multiple rows separated by `,(`
  const metadataBlockRegex = /INSERT INTO\s+redcap_metadata\s*\([^)]*\)\s*VALUES\s*([\s\S]+?);/gi;
  for (const block of sql.matchAll(metadataBlockRegex)) {
    const rowsBody = block[1];
    for (const row of splitTopLevelTuples(rowsBody)) {
      const cells = parseSqlTuple(row);
      if (cells.length < 18) continue;
      // columns expected per the migration:
      // 0  project_id
      // 1  field_name
      // 2  field_phi
      // 3  form_name
      // 4  form_menu_description
      // 5  field_order
      // 6  field_units
      // 7  element_preceding_header
      // 8  element_type
      // 9  element_label
      // 10 element_enum
      // 11 element_note
      // 12 element_validation_type
      // 13 element_validation_min
      // 14 element_validation_max
      // 15 element_validation_checktype
      // 16 branching_logic
      // 17 field_req
      const [
        ,
        fieldName,
        ,
        formName,
        ,
        fieldOrder,
        ,
        ,
        elementType,
        elementLabel,
        elementEnum,
        ,
        elementValidationType,
        ,
        ,
        ,
        branchingLogic,
        fieldReq,
      ] = cells;
      metadata.push({
        formName: unquote(formName) ?? "",
        fieldName: unquote(fieldName) ?? "",
        elementType: unquote(elementType) ?? "",
        elementLabel: unquote(elementLabel) ?? unquote(fieldName) ?? "",
        elementEnum: unquote(elementEnum),
        elementValidationType: unquote(elementValidationType),
        branchingLogic: unquote(branchingLogic),
        required: unquote(fieldReq) === "1",
        fieldOrder: Number(unquote(fieldOrder) ?? "0") || metadata.length + 1,
      });
    }
  }

  return { title, arms, events, eventForms, metadata };
};

const splitTopLevelTuples = (body: string): string[] => {
  const tuples: string[] = [];
  let depth = 0;
  let inString = false;
  let escape = false;
  let buffer = "";
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (escape) {
      buffer += ch;
      escape = false;
      continue;
    }
    if (inString) {
      buffer += ch;
      if (ch === "\\") {
        escape = true;
      } else if (ch === "'") {
        inString = false;
      }
      continue;
    }
    if (ch === "'") {
      buffer += ch;
      inString = true;
      continue;
    }
    if (ch === "(") {
      if (depth === 0) {
        buffer = "";
      } else {
        buffer += ch;
      }
      depth++;
      continue;
    }
    if (ch === ")") {
      depth--;
      if (depth === 0) {
        tuples.push(buffer);
        buffer = "";
      } else {
        buffer += ch;
      }
      continue;
    }
    if (depth >= 1) {
      buffer += ch;
    }
  }
  return tuples;
};

const parseSqlTuple = (row: string): string[] => {
  const cells: string[] = [];
  let inString = false;
  let escape = false;
  let buffer = "";
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (escape) {
      buffer += ch;
      escape = false;
      continue;
    }
    if (inString) {
      buffer += ch;
      if (ch === "\\") {
        escape = true;
      } else if (ch === "'") {
        inString = false;
      }
      continue;
    }
    if (ch === "'") {
      buffer += ch;
      inString = true;
      continue;
    }
    if (ch === ",") {
      cells.push(buffer.trim());
      buffer = "";
      continue;
    }
    buffer += ch;
  }
  if (buffer.length > 0) cells.push(buffer.trim());
  return cells;
};

const unquote = (s: string | undefined): string | null => {
  if (s == null) return null;
  const trimmed = s.trim();
  if (trimmed === "" || trimmed.toUpperCase() === "NULL") return null;
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return stripBackslashEscapes(trimmed.slice(1, -1));
  }
  return trimmed;
};

const REDCAP_DATE_VALIDATION = /date|datetime/i;
const REDCAP_NUMBER_VALIDATION = /^(int|integer|number|float|decimal)/i;

const mapFieldType = (
  field: ParsedField
): { type: string; choices: { value: string; label: string }[] | null; note?: string } => {
  const elementType = field.elementType.toLowerCase();
  switch (elementType) {
    case "yesno":
    case "truefalse":
      return { type: "BOOLEAN", choices: null };
    case "checkbox":
      return { type: "MULTI_SELECT", choices: parseEnumChoices(field.elementEnum) };
    case "radio":
    case "select":
    case "dropdown":
      return { type: "SINGLE_SELECT", choices: parseEnumChoices(field.elementEnum) };
    case "calc":
      return {
        type: "TEXT",
        choices: null,
        note: "Imported from REDCap calc field; calculation logic is not migrated.",
      };
    case "file":
      return {
        type: "TEXT",
        choices: null,
        note: "Imported from REDCap file-upload field; file uploads are not yet supported.",
      };
    case "descriptive":
      return {
        type: "TEXT",
        choices: null,
        note: "Imported from REDCap descriptive field; behaves as a static label.",
      };
    case "slider":
      return {
        type: "NUMBER",
        choices: null,
        note: "Imported from REDCap slider field; rendered as a numeric input.",
      };
    case "sql":
      return {
        type: "TEXT",
        choices: null,
        note: "Imported from REDCap SQL-backed select; choices are not migrated.",
      };
    case "notes":
    case "textarea":
      return { type: "TEXT", choices: null };
    case "text":
    default: {
      const validation = (field.elementValidationType ?? "").toLowerCase();
      if (REDCAP_DATE_VALIDATION.test(validation)) return { type: "DATE", choices: null };
      if (REDCAP_NUMBER_VALIDATION.test(validation)) return { type: "NUMBER", choices: null };
      return { type: "TEXT", choices: null };
    }
  }
};

const parseEnumChoices = (raw: string | null): { value: string; label: string }[] | null => {
  if (!raw) return null;
  // REDCap format: "0, Label \\n 1, Label" where \\n separates choices
  const parts = raw
    .split(/\\n|\\\\n/g)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const choices: { value: string; label: string }[] = [];
  for (const part of parts) {
    const idx = part.indexOf(",");
    if (idx === -1) {
      choices.push({ value: part, label: part });
    } else {
      const value = part.slice(0, idx).trim();
      const label = part.slice(idx + 1).trim();
      choices.push({ value, label: label || value });
    }
  }
  return choices.length > 0 ? choices : null;
};

const slugifyKey = (raw: string): string =>
  raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "field";

const buildTemplate = (templateKey: string, parsed: ParsedTemplate, sourceFile: string): string => {
  const description = TEMPLATE_DESCRIPTIONS[templateKey] ?? `Imported from ${parsed.title}.`;
  const purpose = TEMPLATE_PURPOSES[templateKey] ?? "research";
  const unsupported = UNSUPPORTED_BY_KEY[templateKey] ?? [];

  // Group metadata fields by form_name into instruments.
  const instrumentsByKey = new Map<string, { displayName: string; fields: ParsedField[] }>();
  for (const field of parsed.metadata) {
    const formKey = field.formName || "default";
    let bucket = instrumentsByKey.get(formKey);
    if (!bucket) {
      bucket = { displayName: humanize(formKey), fields: [] };
      instrumentsByKey.set(formKey, bucket);
    }
    bucket.fields.push(field);
  }
  if (instrumentsByKey.size === 0) {
    instrumentsByKey.set("default", { displayName: "Default Form", fields: [] });
  }

  const instruments = Array.from(instrumentsByKey.entries()).map(([key, value]) => {
    const sortedFields = [...value.fields].sort((a, b) => a.fieldOrder - b.fieldOrder);
    const seenKeys = new Set<string>();
    const fields = sortedFields.map((field, idx) => {
      const mapped = mapFieldType(field);
      let key = slugifyKey(field.fieldName);
      while (seenKeys.has(key)) key = `${key}_${idx}`;
      seenKeys.add(key);
      return {
        key,
        label: field.elementLabel || field.fieldName,
        type: mapped.type,
        required: field.required,
        position: idx,
        choicesJson: mapped.choices,
        validationCode: field.elementValidationType,
        branchingJson: field.branchingLogic ? { redcap: field.branchingLogic } : undefined,
        note: mapped.note,
      };
    });
    return { key: slugifyKey(key), displayName: value.displayName, fields };
  });

  const instrumentKeysByFormName: Record<string, string> = {};
  let i = 0;
  for (const [formKey] of instrumentsByKey) {
    instrumentKeysByFormName[formKey] = instruments[i].key;
    i++;
  }

  // Build arms with their events. Map events to arms by armNum order.
  const arms = parsed.arms.map((arm, armIdx) => {
    const armEvents = parsed.events
      .filter((e) => e.armNum === arm.armNum)
      .sort((a, b) => a.dayOffset - b.dayOffset);
    const events = armEvents.map((event, position) => {
      const eventGlobalIdx = parsed.events.indexOf(event);
      const bindingsRaw = parsed.eventForms.filter((b) => b.eventIdx === eventGlobalIdx);
      let bindings = bindingsRaw
        .map((b) => instrumentKeysByFormName[b.formName])
        .filter((k): k is string => Boolean(k))
        .map((instrumentKey) => ({ instrumentKey, required: true, repeating: false }));
      if (bindings.length === 0 && instruments.length > 0) {
        // No explicit binding (e.g. db1 single-form): bind all instruments to every event.
        bindings = instruments.map((inst) => ({
          instrumentKey: inst.key,
          required: true,
          repeating: false,
        }));
      }
      return {
        name: event.descrip,
        position,
        dayOffset: Number.isFinite(event.dayOffset) ? event.dayOffset : null,
        windowDays:
          event.offsetMax !== 0 || event.offsetMin !== 0
            ? Math.abs(event.offsetMax) + Math.abs(event.offsetMin)
            : null,
        instrumentBindings: bindings,
      };
    });
    return { name: arm.armName, position: armIdx, events };
  });

  const template = {
    key: templateKey,
    name: parsed.title,
    description,
    purpose,
    source: { redcapDemo: parsed.title, sourceFile },
    unsupportedFeatures: unsupported.length > 0 ? unsupported : undefined,
    arms,
    instruments,
  };

  const json = JSON.stringify(template, null, 2)
    .replace(/"key": "([A-Z_]+)"/g, '"key": "$1"')
    .replace(/"type": "([A-Z_]+)"/g, '"type": "$1"');

  return `// AUTO-GENERATED by apps/web/modules/clinical/onboarding/scripts/convert-redcap-sql.ts
// Source: ${sourceFile}
// Do not edit by hand — regenerate by running the converter.
import type { TClinicalTemplate } from "../template-types";

export const ${camelCase(templateKey)}Template: TClinicalTemplate = ${json} as TClinicalTemplate;
`;
};

const humanize = (raw: string): string =>
  raw
    .split(/[_-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || raw;

const camelCase = (raw: string): string =>
  raw
    .split(/[_-]+/g)
    .filter(Boolean)
    .map((part, idx) => (idx === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("");

const main = () => {
  const files = readdirSync(SQL_DIR)
    .filter((name) => /^create_demo_db\d+\.sql$/.test(name))
    .sort((a, b) => {
      const an = Number(a.match(/(\d+)/)?.[1] ?? "0");
      const bn = Number(b.match(/(\d+)/)?.[1] ?? "0");
      return an - bn;
    });

  mkdirSync(OUT_DIR, { recursive: true });

  const indexEntries: { exportName: string; key: string; importPath: string }[] = [];

  for (const fileName of files) {
    const dbName = fileName.replace(/\.sql$/, "");
    const templateKey = TEMPLATE_KEY_BY_DB[dbName];
    if (!templateKey) continue;

    const parsed = parseSqlFile(join(SQL_DIR, fileName));
    const ts = buildTemplate(templateKey, parsed, `redcap/redcap_v15.8.4/Resources/sql/${fileName}`);
    const outPath = join(OUT_DIR, `${templateKey}.ts`);
    writeFileSync(outPath, ts, "utf-8");
    indexEntries.push({
      exportName: `${camelCase(templateKey)}Template`,
      key: templateKey,
      importPath: `./${templateKey}`,
    });
    // eslint-disable-next-line no-console
    console.log(
      `wrote ${outPath} (${parsed.arms.length} arms, ${parsed.events.length} events, ${parsed.metadata.length} fields)`
    );
  }

  const indexTs = `// AUTO-GENERATED by apps/web/modules/clinical/onboarding/scripts/convert-redcap-sql.ts
// Do not edit by hand — regenerate by running the converter.
import type { TClinicalTemplate } from "../template-types";
${indexEntries.map((e) => `import { ${e.exportName} } from "${e.importPath}";`).join("\n")}

export const clinicalTemplates: TClinicalTemplate[] = [
${indexEntries.map((e) => `  ${e.exportName},`).join("\n")}
];

export const clinicalTemplateByKey: Record<string, TClinicalTemplate> = Object.fromEntries(
  clinicalTemplates.map((template) => [template.key, template]),
);

export const getClinicalTemplate = (key: string): TClinicalTemplate | undefined =>
  clinicalTemplateByKey[key];

export const listClinicalTemplates = (): TClinicalTemplate[] => clinicalTemplates;
`;
  writeFileSync(join(OUT_DIR, "index.ts"), indexTs, "utf-8");
  // eslint-disable-next-line no-console
  console.log(`wrote ${join(OUT_DIR, "index.ts")} (${indexEntries.length} templates)`);
};

main();
