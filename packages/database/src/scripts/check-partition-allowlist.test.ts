import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { checkPartitionAllowlist } from "./check-partition-allowlist";

const TMP = join(tmpdir(), `partition-allowlist-test-${Date.now()}`);

/** Write a migration.sql into a temp subdirectory. */
async function writeMigration(name: string, sql: string): Promise<void> {
  const dir = join(TMP, name);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "migration.sql"), sql, "utf-8");
}

beforeAll(() => mkdir(TMP, { recursive: true }));
afterAll(() => rm(TMP, { recursive: true, force: true }));

describe("checkPartitionAllowlist", () => {
  it("passes when audit_log is created WITH PARTITION BY RANGE", async () => {
    await writeMigration("001_audit_ok", `
      CREATE TABLE "audit_log" (
        "id" TEXT NOT NULL,
        "occurred_at" TIMESTAMPTZ NOT NULL
      ) PARTITION BY RANGE ("occurred_at");
    `);
    const violations = await checkPartitionAllowlist(TMP);
    expect(violations.filter((v) => v.migrationDir === "001_audit_ok")).toHaveLength(0);
  });

  it("fails when audit_log is created WITHOUT PARTITION BY", async () => {
    await writeMigration("002_audit_bad", `
      CREATE TABLE "audit_log" (
        "id" TEXT NOT NULL,
        "occurred_at" TIMESTAMPTZ NOT NULL
      );
    `);
    const violations = await checkPartitionAllowlist(TMP);
    expect(violations.some((v) => v.migrationDir === "002_audit_bad")).toBe(true);
  });

  it("passes when RecordValue is created WITH PARTITION BY HASH", async () => {
    await writeMigration("003_rv_ok", `
      CREATE TABLE "RecordValue" (
        "id" TEXT NOT NULL,
        "project_id" TEXT NOT NULL
      ) PARTITION BY HASH ("project_id");
    `);
    const violations = await checkPartitionAllowlist(TMP);
    expect(violations.filter((v) => v.migrationDir === "003_rv_ok")).toHaveLength(0);
  });

  it("fails when RecordValue is created WITHOUT PARTITION BY", async () => {
    await writeMigration("004_rv_bad", `
      CREATE TABLE "RecordValue" (
        "id" TEXT NOT NULL,
        "project_id" TEXT NOT NULL
      );
    `);
    const violations = await checkPartitionAllowlist(TMP);
    expect(violations.some((v) => v.migrationDir === "004_rv_bad")).toBe(true);
  });

  it("respects -- partitions:skip escape hatch", async () => {
    await writeMigration("005_skip", `
      CREATE TABLE "audit_log" ("id" TEXT) -- partitions:skip
    `);
    const violations = await checkPartitionAllowlist(TMP);
    expect(violations.filter((v) => v.migrationDir === "005_skip")).toHaveLength(0);
  });

  it("passes on migrations that don't reference allowlisted tables", async () => {
    await writeMigration("006_other", `
      CREATE TABLE "User" ("id" TEXT PRIMARY KEY, "email" TEXT NOT NULL);
    `);
    const violations = await checkPartitionAllowlist(TMP);
    expect(violations.filter((v) => v.migrationDir === "006_other")).toHaveLength(0);
  });

  it("passes for CREATE TABLE IF NOT EXISTS with PARTITION BY (idempotent DDL)", async () => {
    await writeMigration("007_if_not_exists", `
      CREATE TABLE IF NOT EXISTS "audit_log" ("id" TEXT) PARTITION BY RANGE ("occurred_at");
    `);
    const violations = await checkPartitionAllowlist(TMP);
    expect(violations.filter((v) => v.migrationDir === "007_if_not_exists")).toHaveLength(0);
  });

  it("does NOT flag partition child tables (e.g. audit_log_2026_04)", async () => {
    // Child partitions reference the parent name as a prefix — linter must not flag them.
    await writeMigration("008_child_partition", `
      CREATE TABLE IF NOT EXISTS "audit_log_2026_04"
        PARTITION OF "audit_log"
        FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
    `);
    const violations = await checkPartitionAllowlist(TMP);
    expect(violations.filter((v) => v.migrationDir === "008_child_partition")).toHaveLength(0);
  });

  it("handles PARTITION BY spanning multiple lines (lookahead window up to 30)", async () => {
    // PARTITION BY can be 25+ lines after CREATE TABLE for wide column definitions.
    const longColumns = Array.from({ length: 25 }, (_, i) => `  "col${i}" TEXT`).join(",\n");
    await writeMigration("009_wide_table", `
      CREATE TABLE "audit_log" (
${longColumns}
      ) PARTITION BY RANGE ("occurred_at");
    `);
    const violations = await checkPartitionAllowlist(TMP);
    expect(violations.filter((v) => v.migrationDir === "009_wide_table")).toHaveLength(0);
  });

  it("does NOT pass when PARTITION BY appears only inside a SQL comment", async () => {
    // A comment like '-- we chose not to use PARTITION BY' must not suppress a real violation.
    await writeMigration("010_comment_false_pass", `
      CREATE TABLE "audit_log" (
        "id" TEXT NOT NULL
        -- we intentionally skipped PARTITION BY here
      );
    `);
    const violations = await checkPartitionAllowlist(TMP);
    expect(violations.some((v) => v.migrationDir === "010_comment_false_pass")).toBe(true);
  });

  it("returns empty array when migrations directory does not exist", async () => {
    const violations = await checkPartitionAllowlist("/nonexistent/path/migrations");
    expect(violations).toHaveLength(0);
  });
});
