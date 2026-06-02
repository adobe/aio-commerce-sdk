/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { describe, expect, test, vi } from "vitest";

import { registrationRuntimeAction } from "#actions/registration/index";
import { createRuntimeActionParams } from "#test/fixtures/actions";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";

vi.mock("@aio-commerce-sdk/common-utils/actions", async () => {
  const [actual, fixtures] = await Promise.all([
    vi.importActual<typeof import("@aio-commerce-sdk/common-utils/actions")>(
      "@aio-commerce-sdk/common-utils/actions",
    ),
    vi.importActual<typeof import("#test/fixtures/installation")>(
      "#test/fixtures/installation",
    ),
  ]);

  return {
    ...actual,
    logger: vi.fn(() => () => ({
      logger: fixtures.createMockLogger(),
    })),
  };
});

describe("registrationRuntimeAction", () => {
  describe("GET /", () => {
    test("returns the provided registration object in the response body", async () => {
      const registration = {
        menuItems: [{ id: "test::item", title: "Item" }],
      };
      const handler = registrationRuntimeAction({ registration });

      const result = await handler(createRuntimeActionParams());

      expect(result).toMatchObject({ body: { registration } });
    });

    test("returns a 200 response for a non-empty registration", async () => {
      const registration = {
        menuItems: [{ id: "test::item", title: "Item" }],
      };
      const handler = registrationRuntimeAction({ registration });

      const result = await handler(createRuntimeActionParams());

      expect(result).toMatchObject({ type: "success", statusCode: 200 });
    });

    test("returns a 200 response for an empty registration", async () => {
      const handler = registrationRuntimeAction({ registration: {} });

      const result = await handler(createRuntimeActionParams());

      expect(result).toMatchObject({ type: "success", statusCode: 200 });
    });
  });

  describe.each([
    "post",
    "put",
    "patch",
    "delete",
  ] as const)("%s /", (method) => {
    test("returns a 405 response for unsupported methods", async () => {
      const handler = registrationRuntimeAction({ registration: {} });

      const result = await handler(
        createRuntimeActionParams({
          method: method as RuntimeActionParams["__ow_method"],
        }),
      );

      expect(result).toMatchObject({
        type: "error",
        error: { statusCode: 405 },
      });
    });
  });
});
