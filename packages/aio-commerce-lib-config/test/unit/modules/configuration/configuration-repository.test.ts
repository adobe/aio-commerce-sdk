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

describe("configuration-repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFiles = new MockFiles();
    mockStatesByRegion = [new MockState(), new MockState(), new MockState()];
  });

  describe("deleteConfig", () => {
    test("deletes the cache entry from every region's state client", async () => {
      const { deleteConfig } = await import(
        "#modules/configuration/configuration-repository"
      );

      await deleteConfig(SCOPE_CODE);

      expect(mockFiles.delete).toHaveBeenCalledWith(FILE_PATH);
      for (const state of mockStatesByRegion) {
        expect(state.delete).toHaveBeenCalledWith(
          `configuration.${SCOPE_CODE}`,
        );
      }
    });

    test("still invalidates the other regions when one region's delete rejects", async () => {
      mockStatesByRegion[1].delete.mockRejectedValueOnce(
        new Error("region unavailable"),
      );
      const { deleteConfig } = await import(
        "#modules/configuration/configuration-repository"
      );

      await expect(deleteConfig(SCOPE_CODE)).resolves.toBeUndefined();

      for (const state of mockStatesByRegion) {
        expect(state.delete).toHaveBeenCalledWith(
          `configuration.${SCOPE_CODE}`,
        );
      }
    });
  });

  describe("persistConfig", () => {
    test("invalidates every region before writing the fresh value to the current region", async () => {
      const { persistConfig } = await import(
        "#modules/configuration/configuration-repository"
      );

      const payload = { name: "value" };
      await persistConfig(SCOPE_CODE, payload, 3600);

      expect(mockFiles.write).toHaveBeenCalledWith(
        FILE_PATH,
        JSON.stringify(payload),
      );

      // Every region (including the current one) gets its stale entry cleared...
      for (const state of mockStatesByRegion) {
        expect(state.delete).toHaveBeenCalledWith(
          `configuration.${SCOPE_CODE}`,
        );
      }

      // ...then only the current region receives the fresh cached value.
      expect(mockStatesByRegion[0].put).toHaveBeenCalledTimes(1);
      for (const state of mockStatesByRegion.slice(1)) {
        expect(state.put).not.toHaveBeenCalled();
      }
    });
  });
});
