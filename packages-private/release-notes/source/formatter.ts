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

import { ConsolidatedHighlightsSchema, PackageNotesSchema } from "./schema.ts";

import type { LanguageModel, LanguageModelUsage } from "ai";
import type {
  ConsolidatedHighlight,
  PackageNotes,
  ReleaseNotes,
} from "./schema.ts";
import type { ChangelogEntry } from "./types.ts";

const META_PACKAGE = "@adobe/aio-commerce-sdk";

const PACKAGE_NOTES_SYSTEM =
  "You write release notes for a TypeScript monorepo package aimed at developers who consume it as a library. " +
  "Use ONLY the supplied CHANGELOG text — never invent features, links, or PR numbers. " +
  "Copy PR links verbatim from the input. " +
  "Include ONLY changes that directly affect consumers of the public API: new exports, changed behavior, bug fixes observable from outside, performance improvements, and breaking changes. " +
  "EXCLUDE internal refactors, test changes, CI/CD configuration, dependency bumps (unless they change behavior), added files that are not part of the public API, and any change a consumer would never notice. " +
  "If a release contains only excluded changes, set highlights to an empty array. " +
  "For each included highlight, classify it with a conventional commit kind (feat, fix, perf, docs, etc.) and write one concise sentence as its description — no sub-paragraphs. " +
  "Populate breakingChanges only for major version bumps; use an empty array otherwise. " +
  "Write a summary paragraph explaining the user-facing impact and motivation for this package's release overall, focusing only on what consumers need to know.";

const CONSOLIDATE_HIGHLIGHTS_SYSTEM =
  "You merge structured per-package release highlights from a multi-package TypeScript SDK release into a single flat list of user-facing highlights for a release announcement. " +
  "Merge highlights that describe the same underlying feature or fix into ONE bullet, even when they span multiple packages — never repeat the same capability twice just because multiple packages were touched. " +
  "Also merge closely related highlights into a single bullet whenever they can be explained together as one coherent capability, even if they originate from different packages or extraction entries. " +
  "Do not separate features from bug fixes into different groups — return one flat, unordered list covering everything. " +
  "Write from the consumer's perspective: explain what changed and why it is useful, in up to 2 short sentences per bullet. " +
  "Each sentence must be a single simple sentence of no more than 20 words — never join multiple ideas into one sentence with commas, semicolons, or 'and'/'with' lists. " +
  "Each bullet must be under 35 words total. Drop secondary details rather than cramming them in. " +
  "Never mention package names, exports, function names, file paths, config keys, or other code identifiers — describe the capability or behavior in plain language only. " +
  "Only include changes a consumer of the SDK would actually notice or care about.";

const RELEASE_SUMMARY_SYSTEM =
  "You write a concise 'why it matters' paragraph for a multi-package TypeScript SDK release. " +
  "Given the per-package summaries and key highlights across all packages, explain in up to 4-5 short sentences what this release means for developers who consume the SDK and why the included changes are relevant to them. " +
  "Each sentence must be a single simple sentence of no more than 20 words — never join multiple ideas into one sentence with commas, semicolons, or 'and'/'with' lists. " +
  "The whole paragraph must be under 100 words total. Pick only the 2-3 most impactful changes; do not try to mention everything. " +
  "Be concrete — name the specific capabilities unlocked or problems solved, not generic statements like 'improvements were made'. " +
  "Write from the consumer's perspective, in plain language with no technical or code-level details such as package names, function names, or file paths. " +
  "Write plain prose, no bullet points or markdown formatting.";

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
    output: Output.object({ schema: valibotSchema(PackageNotesSchema) }),
    prompt: `Package: ${entry.package} v${entry.version}\n\nCHANGELOG diff:\n${entry.markdown}`,
    system: PACKAGE_NOTES_SYSTEM,
    temperature: 0,
  });

  return { entry, notes: result.output, usage: result.usage };
}

/**
 * Generates a holistic release summary across all packages via one LLM call.
 * Uses per-package summaries and highlights as context.
 */
export async function generateReleaseSummary(
  results: PackageNotesResult[],
  model: LanguageModel,
): Promise<{ summary: string; usage: LanguageModelUsage }> {
  const packageSection = results
    .map((r) => `${r.entry.package}: ${r.notes.summary}`)
    .join("\n");

  const highlights = results.flatMap((r) =>
    r.notes.highlights.map((h) => `${h.kind}: ${h.description}`),
  );
  const highlightSection =
    highlights.length > 0 ? highlights.join("\n") : "(none)";

  const result = await generateText({
    model,
    prompt: `Package summaries:\n${packageSection}\n\nKey highlights:\n${highlightSection}`,
    system: RELEASE_SUMMARY_SYSTEM,
    temperature: 0,
  });

  return { summary: result.text, usage: result.usage };
}

/**
 * Merges per-package highlights into a flat, de-duplicated list of user-facing
 * highlights via one LLM call, cutting across package and kind boundaries.
 */
export async function consolidateHighlights(
  results: PackageNotesResult[],
  model: LanguageModel,
): Promise<{ highlights: ConsolidatedHighlight[]; usage: LanguageModelUsage }> {
  const highlightLines = results.flatMap(({ entry, notes }) =>
    notes.highlights.map(
      (h) => `[${entry.package}] (${h.kind}) ${h.description}`,
    ),
  );
  const highlightSection =
    highlightLines.length > 0 ? highlightLines.join("\n") : "(none)";

  const result = await generateText({
    model,
    output: Output.object({
      schema: valibotSchema(ConsolidatedHighlightsSchema),
    }),
    prompt: `Per-package highlights:\n${highlightSection}`,
    system: CONSOLIDATE_HIGHLIGHTS_SYSTEM,
    temperature: 0,
  });

  return { highlights: result.output.highlights, usage: result.usage };
}

/**
 * Generates notes for all packages in parallel, then synthesizes a holistic summary
 * and a consolidated, cross-package highlight list. Any failure rejects the whole call.
 */
export async function generateAllNotes(
  entries: ChangelogEntry[],
  model: LanguageModel,
): Promise<{
  results: PackageNotesResult[];
  summary: string;
  highlights: ConsolidatedHighlight[];
  totalUsage: LanguageModelUsage;
}> {
  const results = await Promise.all(
    entries.map((entry) => generatePackageNotes(entry, model)),
  );

  const [
    { summary, usage: summaryUsage },
    { highlights, usage: highlightsUsage },
  ] = await Promise.all([
    generateReleaseSummary(results, model),
    consolidateHighlights(results, model),
  ]);

  const allUsages = [
    ...results.map((r) => r.usage),
    summaryUsage,
    highlightsUsage,
  ];
  const totalUsage: LanguageModelUsage = {
    inputTokenDetails: {
      cacheReadTokens: undefined,
      cacheWriteTokens: undefined,
      noCacheTokens: undefined,
    },
    inputTokens: allUsages.reduce((sum, u) => sum + (u.inputTokens ?? 0), 0),
    outputTokenDetails: { reasoningTokens: undefined, textTokens: undefined },
    outputTokens: allUsages.reduce((sum, u) => sum + (u.outputTokens ?? 0), 0),
    totalTokens: allUsages.reduce((sum, u) => sum + (u.totalTokens ?? 0), 0),
  };

  return { highlights, results, summary, totalUsage };
}

/**
 * Assembles the final `ReleaseNotes` object deterministically from per-package results,
 * the holistic summary, and the consolidated highlights.
 */
export function assembleReleaseNotes(
  results: PackageNotesResult[],
  summary: string,
  highlights: ConsolidatedHighlight[],
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

  const breakingChanges = sorted.flatMap(({ entry, notes }) =>
    notes.breakingChanges.map((b) => ({
      ...b,
      packages: [entry.package],
    })),
  );

  return { breakingChanges, headline, highlights, summary };
}
