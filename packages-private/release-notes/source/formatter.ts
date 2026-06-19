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

import { valibotSchema } from "@ai-sdk/valibot";
import { generateText, Output } from "ai";

import { PackageNotesSchema } from "./schema.ts";

import type { LanguageModel, LanguageModelUsage } from "ai";
import type { PackageNotes, ReleaseNotes } from "./schema.ts";
import type { ChangelogEntry } from "./types.ts";

const META_PACKAGE = "@adobe/aio-commerce-sdk";

const PACKAGE_NOTES_SYSTEM =
  "You write release notes for a TypeScript monorepo package. " +
  "Use ONLY the supplied CHANGELOG text — never invent features, links, PR numbers, or handles. " +
  "Copy PR links and @handles verbatim from the input. " +
  "Lead every highlight with the user-facing impact. " +
  "Populate breakingChanges only for major version bumps; use an empty array otherwise.";

export type PackageNotesResult = {
  entry: ChangelogEntry;
  notes: PackageNotes;
  usage: LanguageModelUsage;
};

/**
 * Generates structured release notes for a single package via one LLM call.
 * `temperature: 0` and no tools for deterministic, schema-validated output.
 */
export async function generatePackageNotes(
  entry: ChangelogEntry,
  model: LanguageModel,
): Promise<PackageNotesResult> {
  const result = await generateText({
    model,
    temperature: 0,
    output: Output.object({ schema: valibotSchema(PackageNotesSchema) }),
    system: PACKAGE_NOTES_SYSTEM,
    prompt: `Package: ${entry.package} v${entry.version}\n\nCHANGELOG diff:\n${entry.markdown}`,
  });

  return { entry, notes: result.output, usage: result.usage };
}

/**
 * Generates notes for all packages in parallel.
 * Any per-package failure rejects the whole call.
 */
export async function generateAllNotes(
  entries: ChangelogEntry[],
  model: LanguageModel,
): Promise<{
  results: PackageNotesResult[];
  totalUsage: LanguageModelUsage;
}> {
  const results = await Promise.all(
    entries.map((entry) => generatePackageNotes(entry, model)),
  );

  const totalUsage: LanguageModelUsage = {
    inputTokens: results.reduce(
      (sum, r) => sum + (r.usage.inputTokens ?? 0),
      0,
    ),
    outputTokens: results.reduce(
      (sum, r) => sum + (r.usage.outputTokens ?? 0),
      0,
    ),
    totalTokens: results.reduce(
      (sum, r) => sum + (r.usage.totalTokens ?? 0),
      0,
    ),
    inputTokenDetails: {
      noCacheTokens: undefined,
      cacheReadTokens: undefined,
      cacheWriteTokens: undefined,
    },
    outputTokenDetails: { textTokens: undefined, reasoningTokens: undefined },
  };

  return { results, totalUsage };
}

/**
 * Assembles the final `ReleaseNotes` object deterministically from per-package results.
 * No second LLM call is made here.
 */
export function assembleReleaseNotes(
  results: PackageNotesResult[],
): ReleaseNotes {
  // Meta-package first, then alphabetically.
  const sorted = [...results].sort((a, b) => {
    const aRank = a.entry.package === META_PACKAGE ? 0 : 1;
    const bRank = b.entry.package === META_PACKAGE ? 0 : 1;
    if (aRank !== bRank) {
      return aRank - bRank;
    }
    return a.entry.package.localeCompare(b.entry.package);
  });

  const packageList = sorted
    .map((r) => `${r.entry.package}@${r.entry.version}`)
    .join(", ");
  const headline =
    sorted.find((r) => r.entry.package === META_PACKAGE)?.notes.headline ??
    sorted.find((r) => r.notes.bump === "major")?.notes.headline ??
    sorted.find((r) => r.notes.bump === "minor")?.notes.headline ??
    sorted[0]?.notes.headline ??
    `Release: ${packageList}`;

  const highlights = sorted.flatMap(({ entry, notes }) =>
    notes.highlights.map((h: PackageNotes["highlights"][number]) => ({
      ...h,
      packages: [entry.package],
    })),
  );

  const breakingChanges = sorted.flatMap(({ entry, notes }) =>
    notes.breakingChanges.map((b: PackageNotes["breakingChanges"][number]) => ({
      ...b,
      packages: [entry.package],
    })),
  );

  const byPackage = sorted.map(({ entry, notes }) => ({
    name: entry.package,
    version: entry.version,
    bump: notes.bump,
    entries: notes.entries,
  }));

  const contributors = [
    ...new Set(sorted.flatMap(({ notes }) => notes.contributors)),
  ];

  return { headline, highlights, breakingChanges, byPackage, contributors };
}
