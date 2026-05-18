/**
 * CI linter: fails when two migration directories share the same timestamp
 * prefix. Duplicate timestamps make the runner's alphabetical apply order
 * depend on the post-timestamp slug, which is fragile and can differ between
 * machines.
 *
 * Usage:
 *   pnpm db:migrations:check-timestamps
 *   tsx src/scripts/check-migration-timestamps.ts [migrationsDir]
 */
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Default: ../../migration (the canonical Continium migration directory).
const DEFAULT_MIGRATIONS_DIR = resolve(__dirname, "../../migration");

const TIMESTAMP_REGEX = /^(\d{14})_/;

export interface DuplicateTimestamp {
  timestamp: string;
  directories: string[];
}

export async function findDuplicateTimestamps(
  migrationsDir = DEFAULT_MIGRATIONS_DIR
): Promise<DuplicateTimestamp[]> {
  let entries;
  try {
    entries = await readdir(migrationsDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const byTimestamp = new Map<string, string[]>();

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const match = TIMESTAMP_REGEX.exec(entry.name);
    if (!match) continue;
    const ts = match[1];
    const list = byTimestamp.get(ts) ?? [];
    list.push(entry.name);
    byTimestamp.set(ts, list);
  }

  const duplicates: DuplicateTimestamp[] = [];
  for (const [timestamp, directories] of byTimestamp) {
    if (directories.length > 1) {
      duplicates.push({ timestamp, directories: directories.sort() });
    }
  }
  return duplicates.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

// ── CLI entrypoint ────────────────────────────────────────────────────────────
const scriptName = process.argv[1] ?? "";
const isMain =
  scriptName.endsWith("check-migration-timestamps.ts") ||
  scriptName.endsWith("check-migration-timestamps.js");

if (isMain) {
  const migrationsDir = process.argv[2] ? resolve(process.argv[2]) : undefined;
  const duplicates = await findDuplicateTimestamps(migrationsDir);

  if (duplicates.length === 0) {
    console.log("✓ Migration timestamps check passed — no duplicates found.");
    process.exit(0);
  }

  console.error("✗ Duplicate migration timestamps detected:\n");
  for (const d of duplicates) {
    console.error(`  Timestamp: ${d.timestamp}`);
    for (const dir of d.directories) {
      console.error(`    - ${dir}`);
    }
    console.error(
      "    Fix: rename one of the directories with a later timestamp suffix (e.g. ...0010_).\n"
    );
  }
  process.exit(1);
}
