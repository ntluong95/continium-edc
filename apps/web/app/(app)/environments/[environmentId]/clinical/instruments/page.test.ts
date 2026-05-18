import { redirect } from "next/navigation";
import { describe, expect, test, vi } from "vitest";
import InstrumentsPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("InstrumentsPage", () => {
  test("redirects to the Form Version tab", async () => {
    await InstrumentsPage({ params: Promise.resolve({ environmentId: "env_123" }) });

    expect(redirect).toHaveBeenCalledWith("/environments/env_123/forms?tab=form-version");
  });
});
