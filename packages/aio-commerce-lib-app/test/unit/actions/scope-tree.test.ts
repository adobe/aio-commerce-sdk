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

const {
  resolveCommerceHttpClientParamsMock,
  getScopeTreeMock,
  setCustomScopeTreeMock,
  syncCommerceScopesMock,
  unsyncCommerceScopesMock,
} = vi.hoisted(() => ({
  resolveCommerceHttpClientParamsMock: vi.fn(),
  getScopeTreeMock: vi.fn(),
  setCustomScopeTreeMock: vi.fn(),
  syncCommerceScopesMock: vi.fn(),
  unsyncCommerceScopesMock: vi.fn(),
}));

vi.mock("@adobe/aio-commerce-lib-api", () => ({
  resolveCommerceHttpClientParams: resolveCommerceHttpClientParamsMock,
}));

vi.mock("@adobe/aio-commerce-lib-config", () => ({
  getScopeTree: getScopeTreeMock,
  setCustomScopeTree: setCustomScopeTreeMock,
  syncCommerceScopes: syncCommerceScopesMock,
  unsyncCommerceScopes: unsyncCommerceScopesMock,
}));

import { scopeTreeRuntimeAction } from "#actions/scope-tree";
import { createRuntimeActionParams } from "#test/fixtures/actions";

const scopeTree = [{ id: "default", name: "Default Website" }];

describe("scopeTreeRuntimeAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /", () => {
    test("returns a 200 response when the scope tree is fresh", async () => {
      getScopeTreeMock.mockResolvedValue({
        isCachedData: false,
        scopeTree,
      });

      const result = await scopeTreeRuntimeAction(createRuntimeActionParams());

      expect(result).toMatchObject({
        type: "success",
        statusCode: 200,
      });
    });

    test("returns the scope tree in the response body", async () => {
      getScopeTreeMock.mockResolvedValue({
        isCachedData: false,
        scopeTree,
      });

      const result = await scopeTreeRuntimeAction(createRuntimeActionParams());

      expect(result).toMatchObject({ body: { scopes: scopeTree } });
    });

    test("returns a 203 response when the scope tree is cached", async () => {
      getScopeTreeMock.mockResolvedValue({
        isCachedData: true,
        scopeTree,
      });

      const result = await scopeTreeRuntimeAction(createRuntimeActionParams());

      expect(result).toMatchObject({
        type: "success",
        statusCode: 203,
      });
    });

    test("sets x-cache: hit header when the scope tree is cached", async () => {
      getScopeTreeMock.mockResolvedValue({
        isCachedData: true,
        scopeTree,
      });

      const result = await scopeTreeRuntimeAction(createRuntimeActionParams());

      expect(result).toMatchObject({
        headers: { "x-cache": "hit" },
      });
    });
  });

  describe("PUT /", () => {
    test("stores a custom scope tree", async () => {
      setCustomScopeTreeMock.mockResolvedValue({ synced: true });

      await scopeTreeRuntimeAction(
        createRuntimeActionParams({
          method: "put",
          body: { scopes: scopeTree },
        }),
      );

      expect(setCustomScopeTreeMock).toHaveBeenCalledWith({
        scopes: scopeTree,
      });
    });

    test("sets Cache-Control: no-store on the response", async () => {
      setCustomScopeTreeMock.mockResolvedValue({ synced: true });

      const result = await scopeTreeRuntimeAction(
        createRuntimeActionParams({
          method: "put",
          body: { scopes: scopeTree },
        }),
      );

      expect(result).toMatchObject({
        headers: { "Cache-Control": "no-store" },
      });
    });
  });

  describe("POST /commerce", () => {
    test("syncs commerce scopes with the resolved API client params", async () => {
      const commerceConfig = { token: "resolved-config" };
      resolveCommerceHttpClientParamsMock.mockReturnValue(commerceConfig);
      syncCommerceScopesMock.mockResolvedValue({ synced: true, scopeTree });

      await scopeTreeRuntimeAction(
        createRuntimeActionParams({
          method: "post",
          path: "/commerce",
          body: {
            commerceBaseUrl: "https://commerce.example.com",
            commerceEnv: "stage",
          },
          AIO_COMMERCE_AUTH_IMS_TOKEN: "ims-token",
        }),
      );

      expect(syncCommerceScopesMock).toHaveBeenCalledWith(commerceConfig);
    });

    test("returns the synced scope tree in the response body", async () => {
      resolveCommerceHttpClientParamsMock.mockReturnValue({});
      syncCommerceScopesMock.mockResolvedValue({ synced: true, scopeTree });

      const result = await scopeTreeRuntimeAction(
        createRuntimeActionParams({
          method: "post",
          path: "/commerce",
          body: {
            commerceBaseUrl: "https://commerce.example.com",
            commerceEnv: "stage",
          },
        }),
      );

      expect(result).toMatchObject({
        body: { scopes: scopeTree, synced: true },
      });
    });

    test("returns a 203 response when synced scopes come from cache", async () => {
      resolveCommerceHttpClientParamsMock.mockReturnValue({});
      syncCommerceScopesMock.mockResolvedValue({ synced: false, scopeTree });

      const result = await scopeTreeRuntimeAction(
        createRuntimeActionParams({
          method: "post",
          path: "/commerce",
          body: {
            commerceBaseUrl: "https://commerce.example.com",
            commerceEnv: "stage",
          },
        }),
      );

      expect(result).toMatchObject({
        type: "success",
        statusCode: 203,
      });
    });

    test("sets x-cache: hit header when synced scopes come from cache", async () => {
      resolveCommerceHttpClientParamsMock.mockReturnValue({});
      syncCommerceScopesMock.mockResolvedValue({ synced: false, scopeTree });

      const result = await scopeTreeRuntimeAction(
        createRuntimeActionParams({
          method: "post",
          path: "/commerce",
          body: {
            commerceBaseUrl: "https://commerce.example.com",
            commerceEnv: "stage",
          },
        }),
      );

      expect(result).toMatchObject({
        headers: { "x-cache": "hit" },
      });
    });

    test("returns a 500 response when syncing fails", async () => {
      resolveCommerceHttpClientParamsMock.mockReturnValue({});
      syncCommerceScopesMock.mockResolvedValue({ error: { message: "Boom" } });

      const result = await scopeTreeRuntimeAction(
        createRuntimeActionParams({
          method: "post",
          path: "/commerce",
          body: {
            commerceBaseUrl: "https://commerce.example.com",
            commerceEnv: "stage",
          },
        }),
      );

      expect(result).toMatchObject({
        type: "error",
        error: { statusCode: 500 },
      });
    });
  });

  describe("DELETE /commerce", () => {
    test("returns a success message when commerce scopes are unsynced", async () => {
      unsyncCommerceScopesMock.mockResolvedValue({ unsynced: true });

      const result = await scopeTreeRuntimeAction(
        createRuntimeActionParams({
          method: "delete",
          path: "/commerce",
        }),
      );

      expect(result).toMatchObject({
        type: "success",
        body: { message: "Commerce scopes unsynced successfully" },
      });
    });

    test("returns a no-op message when there are no commerce scopes to unsync", async () => {
      unsyncCommerceScopesMock.mockResolvedValue({ unsynced: false });

      const result = await scopeTreeRuntimeAction(
        createRuntimeActionParams({
          method: "delete",
          path: "/commerce",
        }),
      );

      expect(result).toMatchObject({
        type: "success",
        body: { message: "No commerce scopes to unsync" },
      });
    });
  });
});
