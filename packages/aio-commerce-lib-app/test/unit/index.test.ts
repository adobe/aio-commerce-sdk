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
  mockGetAssociationData,
  mockResolveCommerceHttpClientParams,
  MockAdobeCommerceHttpClient,
} = vi.hoisted(() => ({
  mockGetAssociationData: vi.fn(),
  mockResolveCommerceHttpClientParams: vi.fn(),
  MockAdobeCommerceHttpClient: vi.fn(),
}));

vi.mock("#modules/association/association-repository", () => ({
  getAssociationData: mockGetAssociationData,
}));

vi.mock("@adobe/aio-commerce-lib-api", () => ({
  resolveCommerceHttpClientParams: mockResolveCommerceHttpClientParams,
  AdobeCommerceHttpClient: MockAdobeCommerceHttpClient,
}));

import {
  AppNotAssociatedError,
  getCommerceClient,
  getCommerceInstance,
} from "#index";
import { createRuntimeActionParams } from "#test/fixtures/actions";

describe("getCommerceInstance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns the stored association data", async () => {
    const data = {
      baseUrl: "https://example.com",
      env: "paas" as const,
    };
    mockGetAssociationData.mockResolvedValue(data);

    const result = await getCommerceInstance(createRuntimeActionParams());

    expect(result).toEqual(data);
  });

  test("returns saas env when stored", async () => {
    const data = {
      baseUrl: "https://saas.example.com",
      env: "saas" as const,
    };
    mockGetAssociationData.mockResolvedValue(data);

    const result = await getCommerceInstance(createRuntimeActionParams());

    expect(result).toEqual(data);
  });

  test("throws AppNotAssociatedError when no data is stored", async () => {
    mockGetAssociationData.mockResolvedValue(null);

    await expect(
      getCommerceInstance(createRuntimeActionParams()),
    ).rejects.toBeInstanceOf(AppNotAssociatedError);
  });
});

describe("getCommerceClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns an AdobeCommerceHttpClient when association data is present", async () => {
    const data = {
      baseUrl: "https://example.com",
      env: "paas" as const,
    };
    const resolvedParams = {
      auth: {},
      config: { baseUrl: data.baseUrl, flavor: "paas" },
    };
    mockGetAssociationData.mockResolvedValue(data);
    mockResolveCommerceHttpClientParams.mockReturnValue(resolvedParams);

    const result = await getCommerceClient(createRuntimeActionParams());

    expect(mockResolveCommerceHttpClientParams).toHaveBeenCalledWith(
      expect.objectContaining({
        AIO_COMMERCE_API_BASE_URL: data.baseUrl,
        AIO_COMMERCE_API_FLAVOR: data.env,
      }),
    );
    expect(MockAdobeCommerceHttpClient).toHaveBeenCalledWith(resolvedParams);
    expect(result).toBeInstanceOf(MockAdobeCommerceHttpClient);
  });

  test("passes saas env to resolveCommerceHttpClientParams", async () => {
    const data = {
      baseUrl: "https://saas.example.com",
      env: "saas" as const,
    };
    mockGetAssociationData.mockResolvedValue(data);
    mockResolveCommerceHttpClientParams.mockReturnValue({});

    await getCommerceClient(createRuntimeActionParams());

    expect(mockResolveCommerceHttpClientParams).toHaveBeenCalledWith(
      expect.objectContaining({
        AIO_COMMERCE_API_BASE_URL: data.baseUrl,
        AIO_COMMERCE_API_FLAVOR: "saas",
      }),
    );
  });

  test("throws AppNotAssociatedError when no data is stored", async () => {
    mockGetAssociationData.mockResolvedValue(null);

    await expect(
      getCommerceClient(createRuntimeActionParams()),
    ).rejects.toBeInstanceOf(AppNotAssociatedError);

    expect(mockResolveCommerceHttpClientParams).not.toHaveBeenCalled();
    expect(MockAdobeCommerceHttpClient).not.toHaveBeenCalled();
  });
});
