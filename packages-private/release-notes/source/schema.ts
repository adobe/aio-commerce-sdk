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

import * as v from "valibot";

const HighlightKindSchema = v.picklist([
  "feat",
  "fix",
  "perf",
  "refactor",
  "docs",
  "chore",
  "ci",
  "build",
  "style",
  "test",
  "other",
]);

/**
 * Per-package structured notes produced by a single parallel LLM call.
 */
export const PackageNotesSchema = v.object({
  breakingChanges: v.pipe(
    v.array(
      v.object({
        migration: v.pipe(
          v.string(),
          v.description(
            "Concrete migration steps. Only present for major bumps.",
          ),
        ),
        title: v.string(),
      }),
    ),
    v.description("Empty array unless this is a major bump."),
  ),
  bump: v.picklist(["major", "minor", "patch"]),
  headline: v.pipe(
    v.string(),
    v.description(
      "One sentence summarizing the most important user-facing change in this package.",
    ),
  ),
  highlights: v.array(
    v.object({
      description: v.pipe(
        v.string(),
        v.description(
          "One concise sentence describing the change and its user-facing impact.",
        ),
      ),
      kind: v.pipe(
        HighlightKindSchema,
        v.description("Conventional commit type (feat, fix, perf, etc.)."),
      ),
      prLinks: v.array(
        v.pipe(
          v.string(),
          v.description(
            "PR URLs copied verbatim from the CHANGELOG. Empty array if none.",
          ),
        ),
      ),
    }),
  ),
  packageName: v.pipe(
    v.string(),
    v.description("The npm package name, e.g. @adobe/aio-commerce-lib-core."),
  ),
  summary: v.pipe(
    v.string(),
    v.description(
      "One paragraph explaining the user-facing impact and motivation for this package's changes.",
    ),
  ),
  version: v.pipe(
    v.string(),
    v.description("The published version, e.g. 1.2.0."),
  ),
});

export type PackageNotes = v.InferOutput<typeof PackageNotesSchema>;

/**
 * Aggregate release notes assembled deterministically from per-package results.
 * This is the final output shape published to the GitHub Release body.
 */
export const ReleaseNotesSchema = v.object({
  breakingChanges: v.pipe(
    v.array(
      v.object({
        migration: v.string(),
        packages: v.array(v.string()),
        title: v.string(),
      }),
    ),
    v.description("Empty array if no major bumps in this release."),
  ),
  headline: v.pipe(
    v.string(),
    v.description(
      "One-sentence TL;DR of the release, user-impact first. No version numbers as the lead.",
    ),
  ),
  highlights: v.array(
    v.object({
      description: v.string(),
      kind: HighlightKindSchema,
      packages: v.array(v.string()),
      prLinks: v.array(v.string()),
    }),
  ),
  summary: v.string(),
});

export type ReleaseNotes = v.InferOutput<typeof ReleaseNotesSchema>;
