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

import { createMockLibFiles } from "#test/mocks/lib-files";
import { createMockLibState } from "#test/mocks/lib-state";

const MockState = createMockLibState();
const MockFiles = createMockLibFiles();

let mockFiles = new MockFiles();
let mockStatesByRegion: InstanceType<typeof MockState>[] = [];

vi.mock("#utils/repository", () => ({
  getAllSharedStates: vi.fn(async () => mockStatesByRegion),
  getSharedFiles: vi.fn(async () => mockFiles),
  getSharedState: vi.fn(async () => mockStatesByRegion[0]),
}));

const SCOPE_CODE = "website_1";
const FILE_PATH = "scope/website_1/configuration.json";
const CACHE_KEY = `configuration.${SCOPE_CODE}`;

/** Reads back the payload a region's state client actually holds for the scope, or null. */
async function readCachedPayload(state: InstanceType<typeof MockState>) {
  const result = await state.get(CACHE_KEY);
  return result.value ? JSON.parse(result.value).data : null;
}

describe("configuration-repository", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockFiles = new MockFiles();
    mockStatesByRegion = [new MockState(), new MockState(), new MockState()];

    // Seed every region with a stale cached entry and a stale persisted file,
    // as if it had been written before this change ever ran.
    await Promise.all(
      mockStatesByRegion.map((state) =>
        state.put(CACHE_KEY, JSON.stringify({ data: "stale" })),
      ),
    );
    await mockFiles.write(FILE_PATH, "stale");
  });

  describe("deleteConfig", () => {
    test("removes the persisted file and every region's cached entry", async () => {
      const { deleteConfig } = await import(
        "#modules/configuration/configuration-repository"
      );

      await deleteConfig(SCOPE_CODE);

      await expect(mockFiles.read(FILE_PATH)).rejects.toThrow("ENOENT");
      await Promise.all(
        mockStatesByRegion.map((state) =>
          expect(readCachedPayload(state)).resolves.toBeNull(),
        ),
      );
    });

    test("still invalidates the other regions when one region's delete rejects", async () => {
      mockStatesByRegion[1].delete.mockRejectedValueOnce(
        new Error("region unavailable"),
      );
      const { deleteConfig } = await import(
        "#modules/configuration/configuration-repository"
      );

      await expect(deleteConfig(SCOPE_CODE)).resolves.toBeUndefined();

      await expect(
        readCachedPayload(mockStatesByRegion[0]),
      ).resolves.toBeNull();
      await expect(
        readCachedPayload(mockStatesByRegion[2]),
      ).resolves.toBeNull();

      // The rejected region's delete never actually ran, so its entry remains.
      await expect(readCachedPayload(mockStatesByRegion[1])).resolves.toBe(
        "stale",
      );
    });
  });

  describe("persistConfig", () => {
    test("invalidates every region and caches the fresh value only in the current region", async () => {
      const { persistConfig } = await import(
        "#modules/configuration/configuration-repository"
      );

      const payload = { name: "value" };
      await persistConfig(SCOPE_CODE, payload, 3600);

      const fileContent = await mockFiles.read(FILE_PATH);
      expect(fileContent.toString("utf8")).toBe(JSON.stringify(payload));

      // The current region gets the fresh value...
      await expect(readCachedPayload(mockStatesByRegion[0])).resolves.toBe(
        JSON.stringify(payload),
      );

      // ...while every other region's stale entry is cleared, not refreshed.
      await Promise.all(
        mockStatesByRegion
          .slice(1)
          .map((state) => expect(readCachedPayload(state)).resolves.toBeNull()),
      );
    });

    test("forwards the requested TTL to the current region's cache write", async () => {
      const { persistConfig } = await import(
        "#modules/configuration/configuration-repository"
      );

      await persistConfig(SCOPE_CODE, { name: "value" }, 31_536_000);

      expect(mockStatesByRegion[0].put).toHaveBeenCalledWith(
        CACHE_KEY,
        expect.any(String),
        { ttl: 31_536_000 },
      );
    });
  });
});
