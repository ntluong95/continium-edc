/**
 * CI linter: validates that CREATE TABLE migrations for allowlisted tables
 * declare PARTITION BY. Fails build (exit 1) on violations.
 *
 * Allowlisted tables (must be partitioned at creation):
 *   - audit_log / AuditLog   → PARTITION BY RANGE (occurred_at)
 *   - RecordValue / record_value → PARTITION BY HASH (project_id)
 *
 * Escape hatch: add `-- partitions:skip` on the CREATE TABLE line to suppress
 * the check (e.g. test-only or documentation migrations).
 *
 * Usage:
 *   pnpm db:partitions:lint
 *   tsx src/scripts/check-partition-allowlist.ts [migrationsDir]
 */
import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Default: two levels up from src/scripts/ → packages/database/migrations/
const DEFAULT_MIGRATIONS_DIR = resolve(__dirname, "../../migrations");

/**
 * Tables that MUST declare PARTITION BY when created in a migration.
 * Both Prisma model name and SQL snake_case form are listed so the check
 * catches migrations written either way.
 */
const PARTITION_ALLOWLIST: readonly string[] = [
  "AuditLog",
  "audit_log",
  "RecordValue",
  "record_value",
];

/**
 * Builds a regex matching `CREATE TABLE [IF NOT EXISTS] <table>` (case-insensitive).
 * Uses a negative lookahead `(?!\w)` after the table name so that `audit_log`
 * does NOT match `audit_log_2026_04` (partition child tables).
 */
function buildCreateTableRegex(table: string): RegExp {
  const escaped = table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?["']?${escaped}["']?(?![\\w])`,
    "i"
  );
}

export interface Violation {
  migrationDir: string;
  file: string;
  table: string;
  line: number;
}

/**
 * Scans migration.sql files in migrationsDir and returns violations.
 * A violation = CREATE TABLE for an allowlisted table without PARTITION BY
 * (and without the `-- partitions:skip` escape hatch).
 */
export async function checkPartitionAllowlist(
  migrationsDir = DEFAULT_MIGRATIONS_DIR
): Promise<Violation[]> {
  const violations: Violation[] = [];

  let entries;
  try {
    entries = await readdir(migrationsDir, { withFileTypes: true });
  } catch {
    return violations; // migrations dir doesn't exist — nothing to check
  }

  const dirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  for (const dir of dirs) {
    const sqlPath = join(migrationsDir, dir, "migration.sql");
    let content: string;
    try {
      content = await readFile(sqlPath, "utf-8");
    } catch {
      continue; // no migration.sql in this dir
    }

    const lines = content.split("\n");

    for (const table of PARTITION_ALLOWLIST) {
      const regex = buildCreateTableRegex(table);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!regex.test(line)) continue;

        // Escape hatch: suppress with `-- partitions:skip` on the same line
        if (line.includes("-- partitions:skip")) continue;

        // Look ahead up to 30 lines for PARTITION BY declaration.
        // 30 gives headroom for tables with many columns between CREATE TABLE and PARTITION BY.
        // Strip single-line SQL comments (--) before checking so that a comment
        // containing "PARTITION BY" text does not falsely suppress the violation.
        const lookahead = lines
          .slice(i, Math.min(i + 30, lines.length))
          .map((l) => l.replace(/--.*$/, ""))
          .join("\n");
        if (/PARTITION\s+BY/i.test(lookahead)) continue;

        violations.push({ migrationDir: dir, file: sqlPath, table, line: i + 1 });
      }
    }
  }

  return violations;
}

// ── CLI entrypoint ────────────────────────────────────────────────────────────
const scriptName = process.argv[1] ?? "";
const isMain =
  scriptName.endsWith("check-partition-allowlist.ts") ||
  scriptName.endsWith("check-partition-allowlist.js");

if (isMain) {
  const migrationsDir = process.argv[2] ? resolve(process.argv[2]) : undefined;
  const violations = await checkPartitionAllowlist(migrationsDir);

  if (violations.length === 0) {
    console.log("✓ Partition allowlist check passed — no violations found.");
    process.exit(0);
  }

  console.error("✗ Partition allowlist violations:\n");
  for (const v of violations) {
    console.error(`  Migration: ${v.migrationDir}`);
    console.error(`  Table:     ${v.table}`);
    console.error(`  Line:      ${v.line}`);
    console.error(`  Fix: add PARTITION BY clause, or suppress with '-- partitions:skip'\n`);
  }
  process.exit(1);
}
