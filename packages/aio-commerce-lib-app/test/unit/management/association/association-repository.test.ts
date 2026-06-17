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

// Stateful fake for the system-config storage: keyed by whatever key the
// repository chooses, so the tests assert round-trip behavior instead of
// coupling to the internal storage key.
const { store, mockGetSystemConfigByKey, mockSetSystemConfigByKey } =
  vi.hoisted(() => {
    const store = new Map<string, unknown>();
    return {
      store,
      mockGetSystemConfigByKey: vi.fn(async (key: string) =>
        store.has(key) ? store.get(key) : null,
      ),
      mockSetSystemConfigByKey: vi.fn(async (key: string, value: unknown) => {
        if (value === null || value === undefined) {
          store.delete(key);
        } else {
          store.set(key, value);
        }
      }),
    };
  });

vi.mock("@adobe/aio-commerce-lib-config", () => ({
  getSystemConfigByKey: mockGetSystemConfigByKey,
  setSystemConfigByKey: mockSetSystemConfigByKey,
}));

import {
  clearAssociationData,
  getAssociationData,
  setAssociationData,
} from "#management/association/association-repository";

describe("association-repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.clear();
  });

  test("stores association data and reads it back unchanged", async () => {
    const data = {
      baseUrl: "https://example.com",
      env: "paas" as const,
    };
    await setAssociationData(data);

    expect(await getAssociationData()).toEqual(data);
  });

  test("returns null when no association data has been stored", async () => {
    expect(await getAssociationData()).toBeNull();
  });

  test("overwrites previously stored association data", async () => {
    await setAssociationData({
      baseUrl: "https://first.example.com",
      env: "paas",
    });

    const updated = {
      baseUrl: "https://second.example.com",
      env: "saas" as const,
    };
    await setAssociationData(updated);

    expect(await getAssociationData()).toEqual(updated);
  });

  test("clears stored association data", async () => {
    await setAssociationData({
      baseUrl: "https://example.com",
      env: "saas",
    });
    await clearAssociationData();

    expect(await getAssociationData()).toBeNull();
  });
});
