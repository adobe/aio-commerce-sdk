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

import { beforeEach, describe, expect, test, vi } from "vitest";

import { appConfigRuntimeAction } from "#actions/app-config/index";
import { getOpenApiCacheKey } from "#actions/app-config/openapi";
import { getConfigDomains } from "#config/schema/domains";
import { createRuntimeActionParams } from "#test/fixtures/actions";
import {
  configWithDynamicListOptions,
  configWithFullAdminUiSdk,
  minimalValidConfig,
} from "#test/fixtures/config";

import type { CommerceAppConfig } from "#config/schema/app";

describe("appConfigRuntimeAction", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");
  });

  describe("GET /", () => {
    test("returns the validated app config", async () => {
      const handler = appConfigRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(createRuntimeActionParams());

      expect(result).toMatchObject({
        type: "success",
        body: minimalValidConfig,
      });
    });

    test("returns a 500 error when the app config is invalid", async () => {
      const handler = appConfigRuntimeAction({
        // @ts-expect-error - intentionally invalid app config to trigger validation failure
        appConfig: {},
      });

      const result = await handler(createRuntimeActionParams());

      expect(result).toMatchObject({
        type: "error",
        error: { statusCode: 500 },
      });
    });

    test("returns a 500 error when the app config is missing", async () => {
      const handler = appConfigRuntimeAction({
        // @ts-expect-error - intentionally missing app config
        appConfig: undefined,
      });

      const result = await handler(createRuntimeActionParams());
      expect(result).toMatchObject({
        type: "error",
        error: { statusCode: 500 },
      });
    });

    test("resolves dynamicList options in the response body", async () => {
      const handler = appConfigRuntimeAction({
        appConfig: configWithDynamicListOptions,
      });

      const result = await handler(createRuntimeActionParams());
      expect(result).toMatchObject({
        type: "success",
        body: {
          businessConfig: {
            schema: [
              expect.objectContaining({
                name: "paymentMethod",
                type: "list",
                selectionMode: "single",
                default: "braintree",
                options: [{ label: "Braintree", value: "braintree" }],
              }),
            ],
          },
        },
      });
    });

    test("includes openApiSpecUrl in the response body", async () => {
      const handler = appConfigRuntimeAction({ appConfig: minimalValidConfig });
      const result = await handler(createRuntimeActionParams());

      const domains = getConfigDomains(minimalValidConfig);
      const ck = getOpenApiCacheKey(domains);

      expect(result).toMatchObject({
        type: "success",
        body: {
          openApiSpecUrl: `https://test-namespace.adobeioruntime.net/api/v1/web/app-management/app-config/openapi.json?ck=${ck}`,
        },
      });
    });

    describe("mass action id -> actionId transform", () => {
      test("rewrites a view mass action id to actionId with metadata prefix", async () => {
        const config: CommerceAppConfig = {
          metadata: {
            id: "my-app",
            displayName: "My App",
            description: "Test",
            version: "1.0.0",
          },
          adminUi: {
            order: {
              massActions: [
                {
                  id: "tag-customers",
                  type: "view",
                  path: "#/x",
                  label: "L",
                },
              ],
            },
          },
        };
        const handler = appConfigRuntimeAction({ appConfig: config });
        const result = await handler(createRuntimeActionParams());

        expect.assert(result.type === "success");
        // Cast required: the response body is typed as `{}` by the action handler infrastructure
        type AdminUiBody = {
          adminUi?: { order?: { massActions?: Record<string, unknown>[] } };
        };
        const body = result.body as AdminUiBody;
        const massAction = body.adminUi?.order?.massActions?.[0];
        expect(massAction).toBeDefined();
        expect(massAction?.actionId).toBe("my-app::tag-customers");
        expect(massAction).not.toHaveProperty("id");
        expect(massAction?.type).toBe("view");
        expect(massAction?.path).toBe("#/x");
        expect(massAction?.label).toBe("L");
      });

      test("rewrites a worker mass action id to actionId and preserves runtimeAction", async () => {
        const config: CommerceAppConfig = {
          metadata: {
            id: "my-app",
            displayName: "My App",
            description: "Test",
            version: "1.0.0",
          },
          adminUi: {
            customer: {
              massActions: [
                {
                  id: "export-customers",
                  type: "worker",
                  runtimeAction: "customers/export-customers",
                  label: "Export",
                },
              ],
            },
          },
        };
        const handler = appConfigRuntimeAction({ appConfig: config });
        const result = await handler(createRuntimeActionParams());

        expect.assert(result.type === "success");
        // Cast required: the response body is typed as `{}` by the action handler infrastructure
        type AdminUiBody = {
          adminUi?: { customer?: { massActions?: Record<string, unknown>[] } };
        };
        const body = result.body as AdminUiBody;
        const massAction = body.adminUi?.customer?.massActions?.[0];
        expect(massAction).toBeDefined();
        expect(massAction?.actionId).toBe("my-app::export-customers");
        expect(massAction).not.toHaveProperty("id");
        expect(massAction?.runtimeAction).toBe("customers/export-customers");
      });

      test("returns the config unchanged when adminUi is absent", async () => {
        const handler = appConfigRuntimeAction({
          appConfig: minimalValidConfig,
        });
        const result = await handler(createRuntimeActionParams());

        expect(result).toMatchObject({
          type: "success",
          body: minimalValidConfig,
        });
        expect.assert(result.type === "success");
        expect(result.body as Record<string, unknown>).not.toHaveProperty(
          "adminUi",
        );
      });

      test("passes through other adminUi fields (menuItems, gridColumns) untouched", async () => {
        const handler = appConfigRuntimeAction({
          appConfig: configWithFullAdminUiSdk,
        });
        const result = await handler(createRuntimeActionParams());

        expect.assert(result.type === "success");
        // Cast required: the response body is typed as `{}` by the action handler infrastructure
        type AdminUiBody = {
          adminUi?: {
            menuItems?: unknown;
            bannerNotification?: unknown;
            order?: {
              gridColumns?: unknown;
              massActions?: Record<string, unknown>[];
            };
            customer?: { massActions?: Record<string, unknown>[] };
          };
        };
        const body = result.body as AdminUiBody;

        // menuItems pass through verbatim
        expect(body.adminUi?.menuItems).toEqual(
          configWithFullAdminUiSdk.adminUi?.menuItems,
        );

        // gridColumns pass through verbatim
        expect(body.adminUi?.order?.gridColumns).toEqual(
          configWithFullAdminUiSdk.adminUi?.order?.gridColumns,
        );

        // bannerNotification passes through verbatim
        expect(body.adminUi?.bannerNotification).toEqual(
          configWithFullAdminUiSdk.adminUi?.bannerNotification,
        );

        // Mass actions are transformed with the correct prefix
        const orderMassAction = body.adminUi?.order?.massActions?.[0];
        expect(orderMassAction?.actionId).toBe(
          "test-app-full-admin-ui-sdk::order-mass-action",
        );
        expect(orderMassAction).not.toHaveProperty("id");

        const customerMassAction = body.adminUi?.customer?.massActions?.[0];
        expect(customerMassAction?.actionId).toBe(
          "test-app-full-admin-ui-sdk::export-customers",
        );
        expect(customerMassAction?.runtimeAction).toBe(
          "customers/export-customers",
        );
      });
    });
  });

  describe("GET /openapi.json", () => {
    test("returns the spec without Cache-Control when no cache key is given", async () => {
      const handler = appConfigRuntimeAction({ appConfig: minimalValidConfig });
      const result = await handler(
        createRuntimeActionParams({ path: "/openapi.json" }),
      );

      expect.assert(result.type === "success");
      expect(result.headers).toBeUndefined();
    });

    test("returns the spec without Cache-Control when the cache key does not match", async () => {
      const handler = appConfigRuntimeAction({ appConfig: minimalValidConfig });
      const result = await handler(
        createRuntimeActionParams({
          path: "/openapi.json",
          query: "ck=wrongkey",
        }),
      );

      expect.assert(result.type === "success");
      expect(result.headers).toBeUndefined();
    });

    test("returns the spec with immutable Cache-Control when the cache key matches", async () => {
      const domains = getConfigDomains(minimalValidConfig);
      const ck = getOpenApiCacheKey(domains);

      const handler = appConfigRuntimeAction({ appConfig: minimalValidConfig });
      const result = await handler(
        createRuntimeActionParams({ path: "/openapi.json", query: `ck=${ck}` }),
      );

      expect(result).toMatchObject({
        type: "success",
        headers: { "Cache-Control": "public, max-age=31536000, immutable" },
      });
    });
  });
});
