import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { findDuplicateTimestamps } from "./check-migration-timestamps";

const TMP = join(tmpdir(), `migration-timestamps-test-${Date.now()}`);

beforeAll(() => mkdir(TMP, { recursive: true }));
afterAll(() => rm(TMP, { recursive: true, force: true }));

describe("findDuplicateTimestamps", () => {
  it("returns empty array when all timestamps are unique", async () => {
    const scope = join(TMP, "unique");
    await mkdir(scope, { recursive: true });
    await mkdir(join(scope, "20260101000000_foo"));
    await mkdir(join(scope, "20260102000000_bar"));
    await mkdir(join(scope, "20260103000000_baz"));

    const dups = await findDuplicateTimestamps(scope);
    expect(dups).toEqual([]);
  });

  it("reports a pair when two directories share a timestamp", async () => {
    const scope = join(TMP, "pair");
    await mkdir(scope, { recursive: true });
    await mkdir(join(scope, "20260201000000_alpha"));
    await mkdir(join(scope, "20260201000000_beta"));
    await mkdir(join(scope, "20260202000000_gamma"));

    const dups = await findDuplicateTimestamps(scope);
    expect(dups).toEqual([
      {
        timestamp: "20260201000000",
        directories: ["20260201000000_alpha", "20260201000000_beta"],
      },
    ]);
  });

  it("reports multiple distinct duplicate sets, sorted by timestamp", async () => {
    const scope = join(TMP, "multi");
    await mkdir(scope, { recursive: true });
    await mkdir(join(scope, "20260301000000_x"));
    await mkdir(join(scope, "20260301000000_y"));
    await mkdir(join(scope, "20260401000000_a"));
    await mkdir(join(scope, "20260401000000_b"));
    await mkdir(join(scope, "20260401000000_c"));

    const dups = await findDuplicateTimestamps(scope);
    expect(dups).toHaveLength(2);
    expect(dups[0].timestamp).toBe("20260301000000");
    expect(dups[1].timestamp).toBe("20260401000000");
    expect(dups[1].directories).toEqual([
      "20260401000000_a",
      "20260401000000_b",
      "20260401000000_c",
    ]);
  });

  it("ignores files and directories without a 14-digit timestamp prefix", async () => {
    const scope = join(TMP, "ignored");
    await mkdir(scope, { recursive: true });
    await mkdir(join(scope, "migration_lock"));
    await mkdir(join(scope, "not-a-migration"));
    await mkdir(join(scope, "20260501000000_real"));

    const dups = await findDuplicateTimestamps(scope);
    expect(dups).toEqual([]);
  });

  it("returns empty array when migrations directory does not exist", async () => {
    const dups = await findDuplicateTimestamps(
      join(TMP, "does-not-exist-anywhere-9999")
    );
    expect(dups).toEqual([]);
  });

  it("treats the real Continium migration directory as duplicate-free", async () => {
    // Asserts the post-PR-1 state. If a future migration introduces a
    // duplicate timestamp, this test fails before CI green-lights the PR.
    const dups = await findDuplicateTimestamps();
    expect(dups).toEqual([]);
  });
});
