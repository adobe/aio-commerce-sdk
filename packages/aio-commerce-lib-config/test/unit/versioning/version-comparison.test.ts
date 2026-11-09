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

import { calculateDiff } from "#modules/versioning/diff-calculator";
import {
  compareTwoVersions,
  getVersionComparison,
} from "#modules/versioning/version-comparison";
import { getVersion } from "#modules/versioning/version-repository";

import type { ConfigValue } from "#modules/configuration/types";
import type { ConfigVersion } from "#modules/versioning/types";

vi.mock("#modules/versioning/version-repository", () => ({
  getVersion: vi.fn(),
}));
const context = { maxVersions: 25, namespace: "test" };
const before: ConfigValue[] = [
  {
    name: "removed",
    origin: { code: "global", level: "global" },
    value: ["one", "two"],
  },
  {
    name: "modified",
    origin: { code: "base", level: "website" },
    value: false,
  },
];
const after: ConfigValue[] = [
  { name: "modified", origin: { code: "base", level: "website" }, value: true },
  { name: "added", origin: { code: "base", level: "website" }, value: "value" },
];
const version: ConfigVersion = {
  diff: calculateDiff(before, after),
  id: "version",
  previousVersionId: null,
  scope: { code: "base", id: "idw", level: "website" },
  snapshot: after,
  timestamp: "2026-01-01T00:00:00.000Z",
  versionNumber: 1,
};

describe("version comparisons", () => {
  beforeEach(() => vi.resetAllMocks());

  it("reconstructs removed and changed fields with their original origins", async () => {
    vi.mocked(getVersion).mockResolvedValue(version);
    const result = await getVersionComparison(context, "base", "version");
    expect(result?.before).toEqual(expect.arrayContaining(before));
    expect(result?.before).toHaveLength(before.length);
    expect(result?.after).toEqual(after);
    expect(result?.changes).toEqual(version.diff);
  });

  it("compares typed snapshots without needing the intermediate versions", async () => {
    const earlier = { ...version, id: "earlier", snapshot: before };
    vi.mocked(getVersion)
      .mockResolvedValueOnce(earlier)
      .mockResolvedValueOnce(version);
    const result = await compareTwoVersions(
      context,
      "base",
      "earlier",
      "version",
    );
    expect(result?.changes).toEqual(calculateDiff(before, after));
    expect(result?.fromConfig).toEqual(before);
    expect(result?.toConfig).toEqual(after);
  });

  it("returns null if a requested version is absent", async () => {
    vi.mocked(getVersion).mockResolvedValue(null);
    expect(await getVersionComparison(context, "base", "missing")).toBeNull();
    expect(
      await compareTwoVersions(context, "base", "missing", "version"),
    ).toBeNull();
  });
});
