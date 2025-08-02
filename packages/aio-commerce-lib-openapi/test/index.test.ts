import { describe, expect, it } from "vitest";

import { createRoute, openapi } from "~/index";

describe("aio-commerce-lib-openapi exports", () => {
  it("should export createRoute function", () => {
    expect(createRoute).toBeDefined();
    expect(typeof createRoute).toBe("function");
  });

  it("should export openapi function", () => {
    expect(openapi).toBeDefined();
    expect(typeof openapi).toBe("function");
  });
});
