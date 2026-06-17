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
  configWithEnvScopedBusinessConfig,
  configWithEnvScopedEventingAndWebhooks,
  configWithPaasOnlyWebhook,
} from "#test/fixtures/app-config-router";
import {
  configWithDynamicListOptions,
  configWithFullAdminUiV2,
  minimalValidConfig,
} from "#test/fixtures/config";

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

    test("filters webhooks and events to the commerceEnv query param", async () => {
      const handler = appConfigRuntimeAction({
        appConfig: configWithEnvScopedEventingAndWebhooks,
      });

      const result = await handler(
        createRuntimeActionParams({ query: "commerceEnv=saas" }),
      );

      expect.assert(result.type === "success");
      const body = result.body as {
        webhooks: { label: string }[];
        eventing: { commerce: unknown[] };
      };
      expect(body.webhooks.map((w) => w.label)).toEqual(["All envs"]);
      // The single commerce provider has only a PaaS event, so it is dropped on SaaS.
      expect(body.eventing.commerce).toHaveLength(0);
    });

    test("filters business-config fields to the commerceEnv query param", async () => {
      const handler = appConfigRuntimeAction({
        appConfig: configWithEnvScopedBusinessConfig,
      });

      const result = await handler(
        createRuntimeActionParams({ query: "commerceEnv=saas" }),
      );

      expect.assert(result.type === "success");
      const body = result.body as {
        businessConfig: { schema: { name: string }[] };
      };
      expect(body.businessConfig.schema.map((field) => field.name)).toEqual([
        "sharedField",
      ]);
    });

    test("returns the full config when commerceEnv is omitted", async () => {
      const handler = appConfigRuntimeAction({
        appConfig: configWithPaasOnlyWebhook,
      });

      const result = await handler(createRuntimeActionParams());

      expect.assert(result.type === "success");
      const body = result.body as { webhooks: { label: string }[] };
      expect(body.webhooks).toHaveLength(1);
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

    test("passes adminUi config through untouched to the response", async () => {
      const handler = appConfigRuntimeAction({
        appConfig: configWithFullAdminUiV2,
      });
      const result = await handler(createRuntimeActionParams());

      expect(result).toMatchObject({
        type: "success",
        body: { adminUi: configWithFullAdminUiV2.adminUi },
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
