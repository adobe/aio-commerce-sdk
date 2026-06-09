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

const { mockGetSystemConfigByKey, mockSetSystemConfigByKey } = vi.hoisted(
  () => ({
    mockGetSystemConfigByKey: vi.fn(),
    mockSetSystemConfigByKey: vi.fn(),
  }),
);

vi.mock("@adobe/aio-commerce-lib-config/system", () => ({
  getSystemConfigByKey: mockGetSystemConfigByKey,
  setSystemConfigByKey: mockSetSystemConfigByKey,
}));

import {
  clearAssociationData,
  getAssociationData,
  setAssociationData,
} from "#modules/association/association-repository";

describe("association-repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("setAssociationData", () => {
    test("writes the data under the system.association key", async () => {
      const data = {
        baseUrl: "https://example.com",
        env: "paas" as const,
      };
      await setAssociationData(data);

      expect(mockSetSystemConfigByKey).toHaveBeenCalledWith(
        "system.association",
        data,
      );
    });
  });

  describe("getAssociationData", () => {
    test("reads from the system.association key", async () => {
      const data = {
        baseUrl: "https://example.com",
        env: "saas" as const,
      };
      mockGetSystemConfigByKey.mockResolvedValue(data);

      const result = await getAssociationData();

      expect(mockGetSystemConfigByKey).toHaveBeenCalledWith(
        "system.association",
      );
      expect(result).toEqual(data);
    });

    test("returns null when no data is stored", async () => {
      mockGetSystemConfigByKey.mockResolvedValue(null);

      const result = await getAssociationData();

      expect(result).toBeNull();
    });
  });

  describe("clearAssociationData", () => {
    test("clears the system.association key by setting it to null", async () => {
      await clearAssociationData();

      expect(mockSetSystemConfigByKey).toHaveBeenCalledWith(
        "system.association",
        null,
      );
    });
  });
});
