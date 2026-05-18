import { describe, expect, test, vi } from "vitest";
import { SurveysPage } from "@/modules/survey/list/page";
import FormsPage from "./page";

vi.mock("@/modules/survey/list/page", () => ({
  metadata: { title: "Forms" },
  SurveysPage: vi.fn(() => "surveys-page"),
}));

const params = Promise.resolve({ environmentId: "env_123" });
const searchParams = Promise.resolve({ tab: "form-version" });

describe("FormsPage", () => {
  test("renders the unified survey list and forwards tab search params", () => {
    const result = FormsPage({ params, searchParams });

    expect(result).toMatchObject({
      props: { params: expect.any(Promise), searchParams: expect.any(Promise) },
    });
    expect((result as { type: unknown }).type).toBe(SurveysPage);
  });
});
