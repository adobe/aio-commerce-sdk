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

import { describe, expect, test, vi } from "vitest";

import {
  assembleReleaseNotes,
  generateAllNotes,
  generatePackageNotes,
} from "#formatter";

import type { LanguageModelUsage } from "ai";
import type { PackageNotesResult } from "#formatter";
import type { PackageNotes } from "#schema";
import type { ChangelogEntry } from "#types";

function makeUsage(totalTokens = 30): LanguageModelUsage {
  return {
    inputTokens: 10,
    outputTokens: 20,
    totalTokens,
    inputTokenDetails: {
      noCacheTokens: undefined,
      cacheReadTokens: undefined,
      cacheWriteTokens: undefined,
    },
    outputTokenDetails: { textTokens: undefined, reasoningTokens: undefined },
  };
}

function makeEntry(pkg: string, version: string): ChangelogEntry {
  return {
    package: pkg,
    version,
    markdown: `## ${version}\n\n### Minor Changes\n\n- Added feature.`,
    prevTag: `${pkg}@0.0.1`,
    newTag: `${pkg}@${version}`,
  };
}

function makeNotes(pkg: string, version: string): PackageNotes {
  return {
    packageName: pkg,
    version,
    bump: "minor",
    headline: `${pkg} now has a new feature.`,
    highlights: [
      {
        title: "New feature",
        whatChanged: "Added feature X.",
        whyItMatters: "Users can now do Y.",
        prLinks: ["https://github.com/adobe/aio-commerce-sdk/pull/1"],
      },
    ],
    breakingChanges: [],
    entries: ["Added feature X."],
    contributors: ["@alice"],
  };
}

vi.mock("ai", async () => {
  const actual = await vi.importActual<typeof import("ai")>("ai");
  return {
    ...actual,
    generateText: vi.fn(),
    Output: {
      ...actual.Output,
      object: vi.fn().mockReturnValue({ __mock: true }),
    },
  };
});

const META = "@adobe/aio-commerce-sdk";
const LIB = "@adobe/aio-commerce-lib-core";

function makeResult(
  pkg: string,
  version: string,
  overrides?: Partial<PackageNotes>,
): PackageNotesResult {
  return {
    entry: makeEntry(pkg, version),
    notes: { ...makeNotes(pkg, version), ...overrides },
    usage: makeUsage(),
  };
}

describe("assembleReleaseNotes", () => {
  test("uses the meta-package headline when present", () => {
    const notes = assembleReleaseNotes([
      makeResult(LIB, "2.0.0"),
      makeResult(META, "3.0.0"),
    ]);
    expect(notes.headline).toContain(META);
  });

  test("places meta-package first in byPackage", () => {
    const notes = assembleReleaseNotes([
      makeResult(LIB, "2.0.0"),
      makeResult(META, "3.0.0"),
    ]);
    expect(notes.byPackage[0]?.name).toBe(META);
  });

  test("sorts non-meta packages alphabetically", () => {
    const notes = assembleReleaseNotes([
      makeResult("@adobe/aio-commerce-lib-zebra", "1.0.0"),
      makeResult("@adobe/aio-commerce-lib-alpha", "1.0.0"),
    ]);
    expect(notes.byPackage[0]?.name).toBe("@adobe/aio-commerce-lib-alpha");
    expect(notes.byPackage[1]?.name).toBe("@adobe/aio-commerce-lib-zebra");
  });

  test("places meta-package first when sandwiched between other packages", () => {
    const notes = assembleReleaseNotes([
      makeResult("@adobe/aio-commerce-lib-zebra", "1.0.0"),
      makeResult(META, "2.0.0"),
      makeResult("@adobe/aio-commerce-lib-alpha", "1.0.0"),
    ]);
    expect(notes.byPackage[0]?.name).toBe(META);
    expect(notes.byPackage[1]?.name).toBe("@adobe/aio-commerce-lib-alpha");
    expect(notes.byPackage[2]?.name).toBe("@adobe/aio-commerce-lib-zebra");
  });

  test("falls back to major-bump headline when no meta-package", () => {
    const notes = assembleReleaseNotes([
      makeResult(LIB, "2.0.0", { bump: "major", headline: "Major headline." }),
    ]);
    expect(notes.headline).toBe("Major headline.");
  });

  test("falls back to minor-bump headline when no meta or major", () => {
    const notes = assembleReleaseNotes([
      makeResult(LIB, "1.1.0", { bump: "minor", headline: "Minor headline." }),
    ]);
    expect(notes.headline).toBe("Minor headline.");
  });

  test("falls back to first package headline when no meta, major, or minor", () => {
    const notes = assembleReleaseNotes([
      makeResult(LIB, "1.0.1", { bump: "patch", headline: "Patch headline." }),
    ]);
    expect(notes.headline).toBe("Patch headline.");
  });

  test("uses Release: <packages> headline as last resort when no headlines exist", () => {
    const notes = assembleReleaseNotes([
      makeResult(LIB, "1.0.1", { headline: undefined as unknown as string }),
    ]);
    expect(notes.headline).toContain("Release:");
  });

  test("deduplicates contributors across packages", () => {
    const notes = assembleReleaseNotes([
      makeResult(LIB, "2.0.0", { contributors: ["@alice", "@bob"] }),
      makeResult(META, "3.0.0", { contributors: ["@alice"] }),
    ]);
    expect(notes.contributors.filter((c) => c === "@alice")).toHaveLength(1);
    expect(notes.contributors).toContain("@bob");
  });
});

describe("generatePackageNotes", () => {
  test("calls generateText and returns structured notes", async () => {
    const { generateText } = await import("ai");
    const mockNotes = makeNotes(LIB, "2.0.0");
    (generateText as ReturnType<typeof vi.fn>).mockResolvedValue({
      output: mockNotes,
      usage: makeUsage(150),
    });

    const entry = makeEntry(LIB, "2.0.0");
    const model = {} as Parameters<typeof generatePackageNotes>[1];
    const result = await generatePackageNotes(entry, model);

    expect(result.notes).toEqual(mockNotes);
    expect(result.usage.totalTokens).toBe(150);
    expect(result.entry).toBe(entry);
  });

  test("propagates errors from generateText", async () => {
    const { generateText } = await import("ai");
    (generateText as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("LLM error"),
    );

    const entry = makeEntry(LIB, "2.0.0");
    const model = {} as Parameters<typeof generatePackageNotes>[1];

    await expect(generatePackageNotes(entry, model)).rejects.toThrow(
      "LLM error",
    );
  });
});

describe("generateAllNotes", () => {
  test("treats undefined token counts as zero when aggregating usage", async () => {
    const { generateText } = await import("ai");
    (generateText as ReturnType<typeof vi.fn>).mockResolvedValue({
      output: makeNotes(LIB, "2.0.0"),
      usage: {
        inputTokens: undefined,
        outputTokens: undefined,
        totalTokens: undefined,
        inputTokenDetails: {
          noCacheTokens: undefined,
          cacheReadTokens: undefined,
          cacheWriteTokens: undefined,
        },
        outputTokenDetails: {
          textTokens: undefined,
          reasoningTokens: undefined,
        },
      },
    });

    const { totalUsage } = await generateAllNotes(
      [makeEntry(LIB, "2.0.0")],
      {} as Parameters<typeof generateAllNotes>[1],
    );
    expect(totalUsage.inputTokens).toBe(0);
    expect(totalUsage.outputTokens).toBe(0);
    expect(totalUsage.totalTokens).toBe(0);
  });

  test("returns results and aggregated usage", async () => {
    const { generateText } = await import("ai");
    const mockNotes = makeNotes(LIB, "2.0.0");
    (generateText as ReturnType<typeof vi.fn>).mockResolvedValue({
      output: mockNotes,
      usage: makeUsage(150),
    });

    const entries = [makeEntry(LIB, "2.0.0"), makeEntry(META, "3.0.0")];
    const model = {} as Parameters<typeof generateAllNotes>[1];
    const { results, totalUsage } = await generateAllNotes(entries, model);

    expect(results).toHaveLength(2);
    expect(totalUsage.totalTokens).toBe(300);
  });

  test("throws if any package generation fails", async () => {
    const { generateText } = await import("ai");
    (generateText as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce({
        output: makeNotes(META, "3.0.0"),
        usage: makeUsage(120),
      });

    const entries = [makeEntry(LIB, "2.0.0"), makeEntry(META, "3.0.0")];
    const model = {} as Parameters<typeof generateAllNotes>[1];

    await expect(generateAllNotes(entries, model)).rejects.toThrow("timeout");
  });
});
