import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

/**
 * Meta-tests that the upstream Formbricks taxonomy has been fully retired
 * across the workspace. They run a tightly scoped `git grep` and assert that
 * the only matches (if any) live in i18n lock/translation artefacts or in
 * archived report markdown under `plans/`.
 *
 * If a future PR re-introduces the upstream role values (product-manager,
 * customer-success, people-manager) or the upstream industry literals
 * (e-commerce, saas), this test fails loudly with the offending file and line
 * so the reviewer can decide whether the value belongs in Continium.
 *
 * Patterns are assembled at runtime from token fragments so this test file
 * itself does not match its own grep — see the BANNED_* constants below.
 */

const REPO_ROOT = resolve(__dirname, "../../../../../..");

const isGitRepo = () => existsSync(resolve(REPO_ROOT, ".git"));

/**
 * `git grep` over tracked sources only. Limits results to TS/TSX/Prisma files
 * inside `apps/web`, `packages/`, and the Prisma schema; explicitly excludes
 * lockfiles, generated migrations, plan reports, and node_modules.
 */
const gitGrep = (pattern: string): string[] => {
  try {
    const raw = execSync(
      `git grep -nIE --untracked --no-color -- '${pattern}' \
        'continium/apps/web/**/*.ts' \
        'continium/apps/web/**/*.tsx' \
        'continium/packages/**/*.ts' \
        'continium/packages/database/schema.prisma' \
        ':(exclude)continium/apps/web/plans/**' \
        ':(exclude)continium/apps/web/i18n.lock'`,
      { cwd: REPO_ROOT, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }
    );
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (err) {
    // `git grep` exits 1 when there are no matches — that's the success case.
    if ((err as { status?: number })?.status === 1) return [];
    throw err;
  }
};

const skipIfNoGit = () => {
  if (!isGitRepo()) {
    test.skip("git not available — taxonomy invariants check skipped", () => {});
    return true;
  }
  return false;
};

// Assembled at runtime so this file does not match its own grep.
const BANNED_ROLES = ["product", "customer", "people"].map((p) => `${p}Manager`);
const upstreamCustomerSuccess = ["customer", "Success"].join("");
const BANNED_ROLE_PATTERN = `\\b(${[...BANNED_ROLES, upstreamCustomerSuccess].join("|")})\\b`;
const upstreamEcommerce = ["e", "Commerce"].join("");
const upstreamSaas = ["s", "aas"].join("");
const BANNED_INDUSTRY_PATTERN = `"(${upstreamEcommerce}|${upstreamSaas})"`;
const upstreamFileUploadErrorNames = ["FILE_UPLOAD", "ERROR_NAMES"].join("_");

describe("upstream Formbricks taxonomy is retired", () => {
  if (skipIfNoGit()) return;

  test("no template role uses upstream role values", () => {
    const matches = gitGrep(BANNED_ROLE_PATTERN);
    expect(
      matches,
      `Expected no upstream role values in tracked source. Got:\n${matches.join("\n")}`
    ).toEqual([]);
  });

  test("no industry literal uses upstream values", () => {
    const matches = gitGrep(BANNED_INDUSTRY_PATTERN);
    expect(
      matches,
      `Expected no upstream industry literals in tracked source. Got:\n${matches.join("\n")}`
    ).toEqual([]);
  });

  test("the deleted upstream file-upload error-name constant has no remaining references", () => {
    const matches = gitGrep(upstreamFileUploadErrorNames);
    expect(
      matches,
      `Expected no references to the deleted upstream constant. Got:\n${matches.join("\n")}`
    ).toEqual([]);
  });
});
