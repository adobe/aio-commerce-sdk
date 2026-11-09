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

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockLibFiles } from "#test/mocks/lib-files";
import {
  historyPath,
  historyPrefix,
  listHistoryPaths,
} from "#utils/history-storage";

const MockFiles = createMockLibFiles();
let files = new MockFiles();
vi.mock("#utils/repository", () => ({
  getSharedFiles: vi.fn(async () => files),
}));

describe("Files history listings", () => {
  beforeEach(() => {
    files = new MockFiles();
  });

  it.each([999, 1000, 1001])(
    "lists every record when Files caps each result at 1000 (%i records)",
    async (count) => {
      const paths = Array.from({ length: count }, (_, index) =>
        historyPath("namespace", "audit", "global", `record-${index}`),
      );
      await Promise.all(paths.map((path) => files.write(path, "{}")));
      const originalList = files.list.getMockImplementation();
      if (!originalList) {
        throw new Error("Expected an in-memory Files listing");
      }
      files.list.mockImplementation(async (prefix) =>
        (await originalList(prefix)).slice(0, 1000),
      );
      const result = await listHistoryPaths(
        historyPrefix("namespace", "audit", "global"),
      );
      expect(new Set(result)).toEqual(new Set(paths));
      expect(result).toHaveLength(count);
      expect(
        files.list.mock.calls.every(([prefix]) => prefix?.endsWith("/")),
      ).toBe(true);
      expect(files.list.mock.calls.length).toBe(count < 1000 ? 1 : 17);
    },
  );

  it("isolates collections and namespaces and encodes caller-controlled paths", async () => {
    const path = historyPath(
      "../namespace",
      "versions",
      "../scope",
      "../../id",
    );
    const prefix = historyPrefix("../namespace", "versions", "../scope");
    await files.write(path, "{}");
    expect(path).not.toContain("..");
    expect(await listHistoryPaths(prefix)).toEqual([path]);
    expect(
      await listHistoryPaths(historyPrefix("other", "versions", "../scope")),
    ).toEqual([]);
    expect(
      await listHistoryPaths(
        historyPrefix("../namespace", "audit", "../scope"),
      ),
    ).toEqual([]);
  });

  it("rejects unexpected listed paths before reading arbitrary data", async () => {
    files.list.mockResolvedValueOnce([
      { name: "scope/global/configuration.json" },
    ]);
    await expect(
      listHistoryPaths(historyPrefix("namespace", "versions", "global")),
    ).rejects.toThrow("CORRUPT_HISTORY");
    expect(files.read).not.toHaveBeenCalled();
  });
});
