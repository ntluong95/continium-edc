import { OrganizationRole } from "@prisma/client";
import { describe, expect, test, vi } from "vitest";
import * as constants from "@/lib/constants";
import { getRoles } from "./utils";

vi.mock("@/lib/constants", () => ({
  IS_CONTINIUM_CLOUD: false,
}));

describe("getRoles", () => {
  test("should return all roles except billing when not in Continium Cloud", () => {
    const result = getRoles();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.data).toEqual(Object.values(OrganizationRole).filter((role) => role !== "billing"));
    }
  });

  test("should return all roles including billing when in Continium Cloud", () => {
    const originalValue = constants.IS_CONTINIUM_CLOUD;
    Object.defineProperty(constants, "IS_CONTINIUM_CLOUD", { value: true });
    const result = getRoles();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.data).toEqual(Object.values(OrganizationRole));
    }
    Object.defineProperty(constants, "IS_CONTINIUM_CLOUD", { value: originalValue });
  });
});
