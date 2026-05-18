/**
 * CI parity check: asserts that the tables and enums declared in schema.prisma
 * actually exist in the database with matching shapes.
 *
 * Intentionally focused, not a full `prisma db pull` diff:
 *   1. Every Prisma `model` must map to a table that exists in the public
 *      schema. (Uses @@map when declared; otherwise the model name.)
 *   2. Every Prisma `enum` must exist as a Postgres type with the SAME set of
 *      values (order-independent — Postgres enum order doesn't affect Prisma).
 *
 * This catches the three classes of drift that PR 1 reconciles:
 *   - schema declares a model but the DB table was dropped (Webhook/Integration)
 *   - schema declares an enum value but the DB enum doesn't have it (RecordStatus)
 *   - migrations added DB enum values that schema doesn't declare
 *
 * Usage:
 *   PARITY_DATABASE_URL=postgres://… pnpm db:check:schema-parity
 *   # or set DATABASE_URL when no separate parity DB is available
 *
 * Skips cleanly (exit 0) when neither env var is set, so the script is safe to
 * invoke in pipelines that may not have a DB attached.
 */
import { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DEFAULT_SCHEMA_PATH = resolve(__dirname, "../../schema.prisma");

export interface SchemaModel {
  modelName: string;
  tableName: string;
}

export interface SchemaEnum {
  enumName: string;
  values: string[];
}

export interface ParitySummary {
  missingTables: SchemaModel[];
  missingEnums: string[];
  enumValueMismatches: {
    enumName: string;
    declaredOnly: string[];
    databaseOnly: string[];
  }[];
}

/**
 * Minimal Prisma schema parser that pulls out model/table mappings and enum
 * value sets. Does NOT understand the full Prisma DSL — just the two shapes
 * the parity check needs.
 *
 * Uses a line-based scan rather than a single regex so that braces inside
 * string defaults (e.g. `@default("{}")`) do not prematurely terminate a
 * model body.
 */
export function parseSchemaPrisma(contents: string): {
  models: SchemaModel[];
  enums: SchemaEnum[];
} {
  const models: SchemaModel[] = [];
  const enums: SchemaEnum[] = [];

  const lines = contents.split("\n");

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const stripped = raw.replace(/\/\/.*$/, "").trim();

    const modelMatch = /^model\s+(\w+)\s*\{/.exec(stripped);
    const enumMatch = !modelMatch ? /^enum\s+(\w+)\s*\{/.exec(stripped) : null;

    if (modelMatch) {
      const name = modelMatch[1];
      const body = consumeBlock(lines, i);
      i = body.endIndex + 1;

      const mapMatch =
        /@@map\(\s*name:\s*"([^"]+)"\s*\)|@@map\(\s*"([^"]+)"\s*\)/.exec(body.text);
      const tableName = mapMatch ? (mapMatch[1] ?? mapMatch[2]) : name;
      models.push({ modelName: name, tableName });
      continue;
    }

    if (enumMatch) {
      const name = enumMatch[1];
      const body = consumeBlock(lines, i);
      i = body.endIndex + 1;

      const values = body.text
        .split("\n")
        .map((line) => line.replace(/\/\/.*$/, "").trim())
        .filter(
          (line) =>
            line.length > 0 &&
            !line.startsWith("@@") &&
            !line.startsWith("enum ") &&
            !line.startsWith("model ") &&
            line !== "{" &&
            line !== "}"
        )
        .map((line) => line.split(/\s+/)[0])
        .filter((value) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(value));
      enums.push({ enumName: name, values });
      continue;
    }

    i++;
  }

  return { models, enums };
}

/**
 * Reads a `{ ... }` block starting at `startIndex` (the line that opens the
 * block). Returns the joined body and the index of the closing line.
 * Treats `}` inside double-quoted strings as part of the string, not as a
 * block terminator.
 */
function consumeBlock(
  lines: string[],
  startIndex: number
): { text: string; endIndex: number } {
  let depth = 0;
  let started = false;
  const bodyLines: string[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    let inString = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === "{") {
        depth++;
        started = true;
      } else if (ch === "}") {
        depth--;
        if (started && depth === 0) {
          bodyLines.push(line);
          return { text: bodyLines.join("\n"), endIndex: i };
        }
      }
    }
    bodyLines.push(line);
  }

  return { text: bodyLines.join("\n"), endIndex: lines.length - 1 };
}

async function fetchDatabaseTables(prisma: PrismaClient): Promise<Set<string>> {
  const rows = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type IN ('BASE TABLE', 'PARTITIONED TABLE')
  `;
  return new Set(rows.map((r) => r.table_name));
}

async function fetchDatabaseEnums(prisma: PrismaClient): Promise<Map<string, Set<string>>> {
  const rows = await prisma.$queryRaw<{ typname: string; enumlabel: string }[]>`
    SELECT t.typname, e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
  `;
  const byEnum = new Map<string, Set<string>>();
  for (const row of rows) {
    const set = byEnum.get(row.typname) ?? new Set<string>();
    set.add(row.enumlabel);
    byEnum.set(row.typname, set);
  }
  return byEnum;
}

export async function checkSchemaVsDbParity(
  schemaPath: string = DEFAULT_SCHEMA_PATH,
  prisma: PrismaClient = new PrismaClient()
): Promise<ParitySummary> {
  const contents = await readFile(schemaPath, "utf-8");
  const { models, enums } = parseSchemaPrisma(contents);

  const dbTables = await fetchDatabaseTables(prisma);
  const dbEnums = await fetchDatabaseEnums(prisma);

  // Models that exist as `@@ignore` or `view` blocks should still be expected
  // tables — `@@ignore` only suppresses client generation, not migration.
  const missingTables = models.filter((m) => !dbTables.has(m.tableName));

  const missingEnums: string[] = [];
  const enumValueMismatches: ParitySummary["enumValueMismatches"] = [];

  for (const e of enums) {
    const dbValues = dbEnums.get(e.enumName);
    if (!dbValues) {
      missingEnums.push(e.enumName);
      continue;
    }
    const declared = new Set(e.values);
    const declaredOnly = e.values.filter((v) => !dbValues.has(v));
    const databaseOnly = [...dbValues].filter((v) => !declared.has(v));
    if (declaredOnly.length > 0 || databaseOnly.length > 0) {
      enumValueMismatches.push({ enumName: e.enumName, declaredOnly, databaseOnly });
    }
  }

  return { missingTables, missingEnums, enumValueMismatches };
}

// ── CLI entrypoint ────────────────────────────────────────────────────────────
const scriptName = process.argv[1] ?? "";
const isMain =
  scriptName.endsWith("schema-vs-db-parity.ts") ||
  scriptName.endsWith("schema-vs-db-parity.js");

if (isMain) {
  const parityUrl = process.env.PARITY_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!parityUrl) {
    console.log(
      "↷ schema-vs-db parity check skipped: neither PARITY_DATABASE_URL nor DATABASE_URL is set."
    );
    process.exit(0);
  }

  const prisma = new PrismaClient({ datasources: { db: { url: parityUrl } } });
  try {
    const summary = await checkSchemaVsDbParity(undefined, prisma);

    const hasDrift =
      summary.missingTables.length > 0 ||
      summary.missingEnums.length > 0 ||
      summary.enumValueMismatches.length > 0;

    if (!hasDrift) {
      console.log("✓ schema-vs-db parity check passed.");
      process.exit(0);
    }

    console.error("✗ schema-vs-db parity violations:\n");
    if (summary.missingTables.length > 0) {
      console.error("  Tables declared in schema.prisma but missing from DB:");
      for (const m of summary.missingTables) {
        console.error(`    - model ${m.modelName} (table "${m.tableName}")`);
      }
      console.error("");
    }
    if (summary.missingEnums.length > 0) {
      console.error("  Enums declared in schema.prisma but missing from DB:");
      for (const e of summary.missingEnums) {
        console.error(`    - enum ${e}`);
      }
      console.error("");
    }
    if (summary.enumValueMismatches.length > 0) {
      console.error("  Enum value mismatches:");
      for (const m of summary.enumValueMismatches) {
        console.error(`    - ${m.enumName}`);
        if (m.declaredOnly.length > 0) {
          console.error(`        declared but missing in DB: ${m.declaredOnly.join(", ")}`);
        }
        if (m.databaseOnly.length > 0) {
          console.error(`        present in DB but not declared: ${m.databaseOnly.join(", ")}`);
        }
      }
      console.error("");
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
