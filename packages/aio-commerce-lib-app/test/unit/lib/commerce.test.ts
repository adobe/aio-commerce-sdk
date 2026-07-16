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

const { mockGetAssociationData, MockAdobeCommerceHttpClient } = vi.hoisted(
  () => ({
    MockAdobeCommerceHttpClient: vi.fn(),
    mockGetAssociationData: vi.fn(),
  }),
);

vi.mock("#management/association/repository", () => ({
  getAssociationData: mockGetAssociationData,
}));

vi.mock("@adobe/aio-commerce-lib-api", () => ({
  AdobeCommerceHttpClient: MockAdobeCommerceHttpClient,
}));

import { getCommerceClient, getCommerceInstance } from "#lib/commerce";
import { AssociationRecordNotFoundError } from "#lib/errors";

const auth = { strategy: "ims" } as never;

describe("getCommerceInstance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns the stored Commerce data", async () => {
    const commerce = {
      baseUrl: "https://example.com",
      env: "paas" as const,
    };
    mockGetAssociationData.mockResolvedValue({ commerce });

    const result = await getCommerceInstance();

    expect(result).toEqual(commerce);
  });

  test("returns saas env when stored", async () => {
    const commerce = {
      baseUrl: "https://saas.example.com",
      env: "saas" as const,
    };
    mockGetAssociationData.mockResolvedValue({ commerce });

    const result = await getCommerceInstance();

    expect(result).toEqual(commerce);
  });

  test("throws AssociationRecordNotFoundError when no data is stored", async () => {
    mockGetAssociationData.mockResolvedValue(null);

    await expect(getCommerceInstance()).rejects.toBeInstanceOf(
      AssociationRecordNotFoundError,
    );
  });
});

describe("getCommerceClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("builds the client from the stored instance and supplied auth", async () => {
    const commerce = {
      baseUrl: "https://example.com",
      env: "paas" as const,
    };
    mockGetAssociationData.mockResolvedValue({ commerce });

    const result = await getCommerceClient(auth);

    expect(MockAdobeCommerceHttpClient).toHaveBeenCalledWith({
      auth,
      config: { baseUrl: commerce.baseUrl, flavor: "paas" },
    });
    expect(result).toBeInstanceOf(MockAdobeCommerceHttpClient);
  });

  test("passes the saas flavor from the stored env", async () => {
    const commerce = {
      baseUrl: "https://saas.example.com",
      env: "saas" as const,
    };
    mockGetAssociationData.mockResolvedValue({ commerce });

    await getCommerceClient(auth);

    expect(MockAdobeCommerceHttpClient).toHaveBeenCalledWith({
      auth,
      config: { baseUrl: commerce.baseUrl, flavor: "saas" },
    });
  });

  test("forwards optional fetch options to the client", async () => {
    const commerce = {
      baseUrl: "https://example.com",
      env: "paas" as const,
    };
    mockGetAssociationData.mockResolvedValue({ commerce });

    const fetchOptions = { headers: { "x-trace": "abc" }, timeout: 5000 };
    await getCommerceClient(auth, fetchOptions);

    expect(MockAdobeCommerceHttpClient).toHaveBeenCalledWith(
      expect.objectContaining({ fetchOptions }),
    );
  });

  test("throws AssociationRecordNotFoundError when no data is stored", async () => {
    mockGetAssociationData.mockResolvedValue(null);

    await expect(getCommerceClient(auth)).rejects.toBeInstanceOf(
      AssociationRecordNotFoundError,
    );

    expect(MockAdobeCommerceHttpClient).not.toHaveBeenCalled();
  });
});
