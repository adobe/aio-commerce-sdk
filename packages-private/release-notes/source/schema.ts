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

/**
 * Per-package structured notes produced by a single parallel LLM call.
 *
 * This leaner schema (no top-level headline aggregation) is the target of
 * the per-package `generateText + Output.object()` calls.
 */
export const PackageNotesSchema = v.object({
  packageName: v.pipe(
    v.string(),
    v.description("The npm package name, e.g. @adobe/aio-commerce-lib-core."),
  ),
  version: v.pipe(
    v.string(),
    v.description("The published version, e.g. 1.2.0."),
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
      title: v.string(),
      whatChanged: v.pipe(
        v.string(),
        v.description("Plain-language description of the change."),
      ),
      whyItMatters: v.pipe(
        v.string(),
        v.description("User-facing impact or motivation."),
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
  breakingChanges: v.pipe(
    v.array(
      v.object({
        title: v.string(),
        migration: v.pipe(
          v.string(),
          v.description(
            "Concrete migration steps. Only present for major bumps.",
          ),
        ),
      }),
    ),
    v.description("Empty array unless this is a major bump."),
  ),
  entries: v.array(
    v.pipe(
      v.string(),
      v.description("Raw bullet points from the CHANGELOG for this version."),
    ),
  ),
  contributors: v.array(
    v.pipe(
      v.string(),
      v.description(
        "GitHub handles like @username, copied verbatim from the CHANGELOG. Empty array if none. Exclude bots (if any), like Dependabot or Renovate, as they are not human contributors.",
      ),
    ),
  ),
});

export type PackageNotes = v.InferOutput<typeof PackageNotesSchema>;

/**
 * Aggregate release notes assembled deterministically from per-package results.
 * This is the final output shape published to the GitHub Release body.
 */
export const ReleaseNotesSchema = v.object({
  headline: v.pipe(
    v.string(),
    v.description(
      "One-sentence TL;DR of the release, user-impact first. No version numbers as the lead.",
    ),
  ),
  highlights: v.array(
    v.object({
      title: v.string(),
      whatChanged: v.string(),
      whyItMatters: v.string(),
      packages: v.array(v.string()),
      prLinks: v.array(v.string()),
    }),
  ),
  breakingChanges: v.pipe(
    v.array(
      v.object({
        title: v.string(),
        migration: v.string(),
        packages: v.array(v.string()),
      }),
    ),
    v.description("Empty array if no major bumps in this release."),
  ),
  byPackage: v.array(
    v.object({
      name: v.string(),
      version: v.string(),
      bump: v.picklist(["major", "minor", "patch"]),
      entries: v.array(v.string()),
    }),
  ),
  contributors: v.array(v.string()),
});

export type ReleaseNotes = v.InferOutput<typeof ReleaseNotesSchema>;
