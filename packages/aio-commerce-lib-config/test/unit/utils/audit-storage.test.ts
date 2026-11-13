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
import { auditPath, auditPrefix, listAuditPaths } from "#utils/audit-storage";

const MockFiles = createMockLibFiles();
let files = new MockFiles();
vi.mock("#utils/repository", () => ({
  getSharedFiles: vi.fn(async () => files),
}));

describe("Files audit listings", () => {
  beforeEach(() => {
    files = new MockFiles();
  });

  it.each([999, 1000, 1001])(
    "lists every record when Files caps each result at 1000 (%i records)",
    async (count) => {
      const paths = Array.from({ length: count }, (_, index) =>
        auditPath("namespace", `record-${index}`),
      );
      await Promise.all(paths.map((path) => files.write(path, "{}")));
      const originalList = files.list.getMockImplementation();
      if (!originalList) {
        throw new Error("Expected an in-memory Files listing");
      }
      files.list.mockImplementation(async (prefix) =>
        (await originalList(prefix)).slice(0, 1000),
      );
      const result = await listAuditPaths(auditPrefix("namespace"));
      expect(new Set(result)).toEqual(new Set(paths));
      expect(result).toHaveLength(count);
      expect(
        files.list.mock.calls.every(([prefix]) => prefix?.endsWith("/")),
      ).toBe(true);
      expect(files.list.mock.calls.length).toBe(count < 1000 ? 1 : 17);
    },
  );

  it("isolates namespaces and encodes caller-controlled paths", async () => {
    const path = auditPath("../namespace", "../../id");
    const prefix = auditPrefix("../namespace");
    await files.write(path, "{}");
    expect(path).not.toContain("..");
    expect(await listAuditPaths(prefix)).toEqual([path]);
    expect(await listAuditPaths(auditPrefix("other"))).toEqual([]);
  });

  it("rejects unexpected listed paths before reading arbitrary data", async () => {
    files.list.mockResolvedValueOnce([
      { name: "scope/global/configuration.json" },
    ]);
    await expect(listAuditPaths(auditPrefix("namespace"))).rejects.toThrow(
      "CORRUPT_AUDIT",
    );
    expect(files.read).not.toHaveBeenCalled();
  });
});
