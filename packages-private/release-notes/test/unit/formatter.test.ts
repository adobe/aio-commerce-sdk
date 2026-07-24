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
  consolidateHighlights,
  generateAllNotes,
  generatePackageNotes,
  generateReleaseSummary,
} from "#formatter";

import type { LanguageModel, LanguageModelUsage } from "ai";
import type { PackageNotesResult } from "#formatter";
import type { PackageNotes } from "#schema";
import type { ChangelogEntry } from "#types";

function makeUsage(totalTokens = 30): LanguageModelUsage {
  return {
    inputTokenDetails: {
      cacheReadTokens: undefined,
      cacheWriteTokens: undefined,
      noCacheTokens: undefined,
    },
    inputTokens: 10,
    outputTokenDetails: { reasoningTokens: undefined, textTokens: undefined },
    outputTokens: 20,
    totalTokens,
  };
}

function makeEntry(pkg: string, version: string): ChangelogEntry {
  return {
    markdown: `## ${version}\n\n### Minor Changes\n\n- Added feature.`,
    newTag: `${pkg}@${version}`,
    package: pkg,
    prevTag: `${pkg}@0.0.1`,
    version,
  };
}

function makeNotes(pkg: string, version: string): PackageNotes {
  return {
    breakingChanges: [],
    bump: "minor",
    headline: `${pkg} now has a new feature.`,
    highlights: [
      {
        description: "Added feature X, enabling users to do Y.",
        kind: "feat",
        prLinks: ["https://github.com/adobe/aio-commerce-sdk/pull/1"],
      },
    ],
    packageName: pkg,
    summary: `${pkg} received a new feature improving user experience.`,
    version,
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
  test("uses provided summary", () => {
    const notes = assembleReleaseNotes(
      [makeResult(LIB, "1.0.0")],
      "Holistic release summary.",
      [],
    );
    expect(notes.summary).toBe("Holistic release summary.");
  });

  test("uses the provided consolidated highlights as-is", () => {
    const highlights = [{ description: "Merged cross-package feature." }];
    const notes = assembleReleaseNotes(
      [makeResult(LIB, "1.0.0")],
      "",
      highlights,
    );
    expect(notes.highlights).toBe(highlights);
  });

  test("uses the meta-package headline when present", () => {
    const notes = assembleReleaseNotes(
      [makeResult(LIB, "2.0.0"), makeResult(META, "3.0.0")],
      "",
      [],
    );
    expect(notes.headline).toContain(META);
  });

  test("falls back to major-bump headline when no meta-package", () => {
    const notes = assembleReleaseNotes(
      [
        makeResult(LIB, "2.0.0", {
          bump: "major",
          headline: "Major headline.",
        }),
      ],
      "",
      [],
    );
    expect(notes.headline).toBe("Major headline.");
  });

  test("falls back to minor-bump headline when no meta or major", () => {
    const notes = assembleReleaseNotes(
      [
        makeResult(LIB, "1.1.0", {
          bump: "minor",
          headline: "Minor headline.",
        }),
      ],
      "",
      [],
    );
    expect(notes.headline).toBe("Minor headline.");
  });

  test("falls back to first package headline when no meta, major, or minor", () => {
    const notes = assembleReleaseNotes(
      [
        makeResult(LIB, "1.0.1", {
          bump: "patch",
          headline: "Patch headline.",
        }),
      ],
      "",
      [],
    );
    expect(notes.headline).toBe("Patch headline.");
  });

  test("uses Release: <packages> headline as last resort when no headlines exist", () => {
    const notes = assembleReleaseNotes(
      [makeResult(LIB, "1.0.1", { headline: undefined as unknown as string })],
      "",
      [],
    );
    expect(notes.headline).toContain("Release:");
  });

  test("sorts non-meta packages alphabetically for breaking changes", () => {
    const notes = assembleReleaseNotes(
      [
        makeResult("@adobe/aio-commerce-lib-zebra", "1.0.0", {
          breakingChanges: [{ migration: "Migrate.", title: "Zebra change" }],
        }),
        makeResult("@adobe/aio-commerce-lib-alpha", "1.0.0", {
          breakingChanges: [{ migration: "Migrate.", title: "Alpha change" }],
        }),
      ],
      "",
      [],
    );
    expect(notes.breakingChanges[0]?.title).toBe("Alpha change");
    expect(notes.breakingChanges[1]?.title).toBe("Zebra change");
  });

  test("propagates breaking changes with package attribution", () => {
    const notes = assembleReleaseNotes(
      [
        makeResult(LIB, "2.0.0", {
          breakingChanges: [
            {
              migration: "Replace `foo()` with `bar()`.",
              title: "Removed foo",
            },
          ],
        }),
      ],
      "",
      [],
    );
    expect(notes.breakingChanges[0]?.title).toBe("Removed foo");
    expect(notes.breakingChanges[0]?.packages).toEqual([LIB]);
  });
});

describe("generateReleaseSummary", () => {
  test("returns summary text and usage from generateText", async () => {
    const { generateText } = await import("ai");
    (generateText as ReturnType<typeof vi.fn>).mockResolvedValue({
      text: "This release delivers nested ACL and webhook fixes.",
      usage: makeUsage(80),
    });

    const results = [makeResult(LIB, "2.0.0"), makeResult(META, "3.0.0")];
    const model = {} as Parameters<typeof generateReleaseSummary>[1];
    const { summary, usage } = await generateReleaseSummary(results, model);

    expect(summary).toBe("This release delivers nested ACL and webhook fixes.");
    expect(usage.totalTokens).toBe(80);
  });

  test("includes per-package summaries and highlights in the prompt", async () => {
    const { generateText } = await import("ai");
    (generateText as ReturnType<typeof vi.fn>).mockResolvedValue({
      text: "Summary.",
      usage: makeUsage(50),
    });

    const results = [makeResult(LIB, "1.0.0", { summary: "Lib summary." })];
    const model = {} as Parameters<typeof generateReleaseSummary>[1];
    await generateReleaseSummary(results, model);

    const call = (generateText as ReturnType<typeof vi.fn>).mock.lastCall?.[0];
    expect(call.prompt).toContain("Lib summary.");
    expect(call.prompt).toContain("Added feature X");
  });

  test("handles results with no highlights", async () => {
    const { generateText } = await import("ai");
    (generateText as ReturnType<typeof vi.fn>).mockResolvedValue({
      text: "Chore release.",
      usage: makeUsage(30),
    });

    const results = [makeResult(LIB, "1.0.1", { highlights: [] })];
    const model = {} as Parameters<typeof generateReleaseSummary>[1];
    const { summary } = await generateReleaseSummary(results, model);

    const call = (generateText as ReturnType<typeof vi.fn>).mock.lastCall?.[0];
    expect(call.prompt).toContain("(none)");
    expect(summary).toBe("Chore release.");
  });

  test("propagates errors from generateText", async () => {
    const { generateText } = await import("ai");
    (generateText as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("summary error"),
    );

    await expect(
      generateReleaseSummary([makeResult(LIB, "1.0.0")], {} as LanguageModel),
    ).rejects.toThrow("summary error");
  });
});

describe("consolidateHighlights", () => {
  test("returns highlights and usage from generateText", async () => {
    const { generateText } = await import("ai");
    (generateText as ReturnType<typeof vi.fn>).mockResolvedValue({
      output: {
        highlights: [{ description: "Merged cross-package feature." }],
      },
      usage: makeUsage(60),
    });

    const results = [makeResult(LIB, "1.0.0"), makeResult(META, "2.0.0")];
    const model = {} as Parameters<typeof consolidateHighlights>[1];
    const { highlights, usage } = await consolidateHighlights(results, model);

    expect(highlights).toEqual([
      { description: "Merged cross-package feature." },
    ]);
    expect(usage.totalTokens).toBe(60);
  });

  test("includes per-package highlights, kind, and package name in the prompt", async () => {
    const { generateText } = await import("ai");
    (generateText as ReturnType<typeof vi.fn>).mockResolvedValue({
      output: { highlights: [] },
      usage: makeUsage(40),
    });

    const results = [makeResult(LIB, "1.0.0")];
    const model = {} as Parameters<typeof consolidateHighlights>[1];
    await consolidateHighlights(results, model);

    const call = (generateText as ReturnType<typeof vi.fn>).mock.lastCall?.[0];
    expect(call.prompt).toContain(LIB);
    expect(call.prompt).toContain("feat");
    expect(call.prompt).toContain("Added feature X");
  });

  test("handles results with no highlights", async () => {
    const { generateText } = await import("ai");
    (generateText as ReturnType<typeof vi.fn>).mockResolvedValue({
      output: { highlights: [] },
      usage: makeUsage(20),
    });

    const results = [makeResult(LIB, "1.0.1", { highlights: [] })];
    const model = {} as Parameters<typeof consolidateHighlights>[1];
    await consolidateHighlights(results, model);

    const call = (generateText as ReturnType<typeof vi.fn>).mock.lastCall?.[0];
    expect(call.prompt).toContain("(none)");
  });

  test("propagates errors from generateText", async () => {
    const { generateText } = await import("ai");
    (generateText as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("consolidation error"),
    );

    await expect(
      consolidateHighlights([makeResult(LIB, "1.0.0")], {} as LanguageModel),
    ).rejects.toThrow("consolidation error");
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
    const undefinedUsage = {
      inputTokenDetails: {
        cacheReadTokens: undefined,
        cacheWriteTokens: undefined,
        noCacheTokens: undefined,
      },
      inputTokens: undefined,
      outputTokenDetails: { reasoningTokens: undefined, textTokens: undefined },
      outputTokens: undefined,
      totalTokens: undefined,
    };
    (generateText as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        output: makeNotes(LIB, "2.0.0"),
        usage: undefinedUsage,
      })
      .mockResolvedValueOnce({ text: "Summary.", usage: undefinedUsage })
      .mockResolvedValueOnce({
        output: { highlights: [] },
        usage: undefinedUsage,
      });

    const { totalUsage } = await generateAllNotes(
      [makeEntry(LIB, "2.0.0")],
      {} as Parameters<typeof generateAllNotes>[1],
    );
    expect(totalUsage.inputTokens).toBe(0);
    expect(totalUsage.outputTokens).toBe(0);
    expect(totalUsage.totalTokens).toBe(0);
  });

  test("returns results, summary, highlights, and aggregated usage", async () => {
    const { generateText } = await import("ai");
    (generateText as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        output: makeNotes(LIB, "2.0.0"),
        usage: makeUsage(150),
      })
      .mockResolvedValueOnce({
        output: makeNotes(META, "3.0.0"),
        usage: makeUsage(150),
      })
      .mockResolvedValueOnce({
        text: "Holistic summary.",
        usage: makeUsage(100),
      })
      .mockResolvedValueOnce({
        output: {
          highlights: [{ description: "Merged cross-package feature." }],
        },
        usage: makeUsage(50),
      });

    const entries = [makeEntry(LIB, "2.0.0"), makeEntry(META, "3.0.0")];
    const { results, summary, highlights, totalUsage } = await generateAllNotes(
      entries,
      {} as Parameters<typeof generateAllNotes>[1],
    );

    expect(results).toHaveLength(2);
    expect(summary).toBe("Holistic summary.");
    expect(highlights).toEqual([
      { description: "Merged cross-package feature." },
    ]);
    expect(totalUsage.totalTokens).toBe(450); // 150 + 150 + 100 + 50
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

    await expect(
      generateAllNotes(entries, {} as Parameters<typeof generateAllNotes>[1]),
    ).rejects.toThrow("timeout");
  });
});
