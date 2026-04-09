/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from "vitest";

import {
  getAllScopeData,
  getStoreGroups,
  getStoreViews,
  getWebsites,
} from "#api/commerce";
import {
  mockStoreGroups,
  mockStoreViews,
  mockWebsites,
} from "#test/fixtures/commerce-scope-data";

import type { CommerceHttpClientParams } from "@adobe/aio-commerce-lib-api";
import type { ImsAuthParams } from "@adobe/aio-commerce-lib-auth";

vi.mock("@adobe/aio-commerce-lib-auth", async () => {
  const original = await vi.importActual("@adobe/aio-commerce-lib-auth");
  return {
    ...original,
    getImsAuthProvider: vi.fn((params: ImsAuthParams) => ({
      getAccessToken: vi.fn(() => "mock-token"),
      getHeaders: vi.fn(() => ({
        Authorization: "Bearer mock-token",
        "x-api-key": params.clientId,
      })),
    })),
  };
});

const BASE_URL = "https://test.commerce.com/V1";

const clientParams: CommerceHttpClientParams = {
  config: { baseUrl: "https://test.commerce.com", flavor: "saas" },
  fetchOptions: { retry: 0 },
  auth: {
    clientId: "test-client-id",
    clientSecrets: ["test-client-secret"],
    technicalAccountId: "test-account-id",
    technicalAccountEmail: "test@adobe.com",
    imsOrgId: "test-org@AdobeOrg",
    environment: "prod",
  },
};

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

const client = new AdobeCommerceHttpClient(clientParams);

describe("api/commerce", () => {
  describe("getWebsites", () => {
    test("should return websites from the Commerce API", async () => {
      server.use(
        http.get(`${BASE_URL}/store/websites`, () =>
          HttpResponse.json(mockWebsites),
        ),
      );

      const result = await getWebsites(client);
      expect(result).toEqual(mockWebsites);
    });

    test("should throw when the request fails", async () => {
      server.use(
        http.get(`${BASE_URL}/store/websites`, () =>
          HttpResponse.json({}, { status: 500 }),
        ),
      );

      await expect(getWebsites(client)).rejects.toThrow(
        "Failed to fetch websites",
      );
    });
  });

  describe("getStoreGroups", () => {
    test("should return store groups from the Commerce API", async () => {
      server.use(
        http.get(`${BASE_URL}/store/storeGroups`, () =>
          HttpResponse.json(mockStoreGroups),
        ),
      );

      const result = await getStoreGroups(client);
      expect(result).toEqual(mockStoreGroups);
    });

    test("should throw when the request fails", async () => {
      server.use(
        http.get(`${BASE_URL}/store/storeGroups`, () =>
          HttpResponse.json({}, { status: 500 }),
        ),
      );

      await expect(getStoreGroups(client)).rejects.toThrow(
        "Failed to fetch store groups",
      );
    });
  });

  describe("getStoreViews", () => {
    test("should return store views from the Commerce API", async () => {
      server.use(
        http.get(`${BASE_URL}/store/storeViews`, () =>
          HttpResponse.json(mockStoreViews),
        ),
      );

      const result = await getStoreViews(client);
      expect(result).toEqual(mockStoreViews);
    });

    test("should throw when the request fails", async () => {
      server.use(
        http.get(`${BASE_URL}/store/storeViews`, () =>
          HttpResponse.json({}, { status: 500 }),
        ),
      );

      await expect(getStoreViews(client)).rejects.toThrow(
        "Failed to fetch store views",
      );
    });
  });

  describe("getAllScopeData", () => {
    test("should return combined scope data from all three endpoints", async () => {
      server.use(
        http.get(`${BASE_URL}/store/websites`, () =>
          HttpResponse.json(mockWebsites),
        ),
        http.get(`${BASE_URL}/store/storeGroups`, () =>
          HttpResponse.json(mockStoreGroups),
        ),
        http.get(`${BASE_URL}/store/storeViews`, () =>
          HttpResponse.json(mockStoreViews),
        ),
      );

      const result = await getAllScopeData(client);

      expect(result).toEqual({
        websites: mockWebsites,
        storeGroups: mockStoreGroups,
        storeViews: mockStoreViews,
      });
    });

    test("should throw when any endpoint fails", async () => {
      server.use(
        http.get(`${BASE_URL}/store/websites`, () =>
          HttpResponse.json({}, { status: 500 }),
        ),
        http.get(`${BASE_URL}/store/storeGroups`, () =>
          HttpResponse.json(mockStoreGroups),
        ),
        http.get(`${BASE_URL}/store/storeViews`, () =>
          HttpResponse.json(mockStoreViews),
        ),
      );

      await expect(getAllScopeData(client)).rejects.toThrow(
        "Failed to fetch Commerce scope data",
      );
    });
  });
});
