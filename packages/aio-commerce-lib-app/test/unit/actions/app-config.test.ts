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

import { appConfigRuntimeAction } from "#actions/app-config";
import {
  appConfigWithDynamicListOptions,
  appConfigWithoutBusinessConfig,
  appConfigWithStaticListOptions,
} from "#test/fixtures/config";

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

describe("appConfigRuntimeAction", () => {
  describe("GET /", () => {
    const mockParams = {
      __ow_method: "get",
      __ow_path: "/",
      __ow_headers: {},
    } satisfies RuntimeActionParams;

    test("returns config as-is when there is no business config schema", async () => {
      const result = await appConfigRuntimeAction({
        appConfig: appConfigWithoutBusinessConfig,
      })(mockParams);

      expect(result).toMatchObject({
        type: "success",
        statusCode: 200,
        body: { metadata: { id: appConfigWithoutBusinessConfig.metadata.id } },
      });
    });

    test("returns config as-is when the business config schema has only static options", async () => {
      const result = await appConfigRuntimeAction({
        appConfig: appConfigWithStaticListOptions,
      })(mockParams);

      expect(result).toMatchObject({
        type: "success",
        statusCode: 200,
        body: {
          businessConfig: {
            schema: [{ options: [{ label: "Braintree", value: "braintree" }] }],
          },
        },
      });
    });

    test("resolves dynamic business config options with runtime params", async () => {
      const result = await appConfigRuntimeAction({
        appConfig: appConfigWithDynamicListOptions,
      })(mockParams);

      expect(result).toMatchObject({
        type: "success",
        statusCode: 200,
        body: {
          businessConfig: {
            schema: [{ options: [{ label: "Braintree", value: "braintree" }] }],
          },
        },
      });
    });
  });
});
