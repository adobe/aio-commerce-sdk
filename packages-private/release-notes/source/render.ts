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

import type { ReleaseNotes } from "./schema.ts";

/**
 * Renders a `ReleaseNotes` object to a GitHub-flavored markdown string.
 *
 * Render order: TL;DR > Highlights > Breaking changes > By package > Contributors.
 */
export function renderMarkdown(notes: ReleaseNotes): string {
  const sections: string[] = [];
  sections.push(`${notes.headline}`);

  if (notes.highlights.length > 0) {
    sections.push("## Highlights");
    for (const h of notes.highlights) {
      const prLinks = h.prLinks.map((url) => `[PR](${url})`).join(", ");
      const prLinksText = prLinks ? ` (${prLinks})` : "";

      sections.push(
        `### ${h.title}${prLinksText}\n\n${h.whatChanged}\n\n**Why it matters:** ${h.whyItMatters}\n\n**Packages:** ${h.packages.join(", ")}`,
      );
    }
  }

  if (notes.breakingChanges.length > 0) {
    sections.push("## Breaking Changes");
    for (const b of notes.breakingChanges) {
      sections.push(
        `### ${b.title}\n\n**Packages:** ${b.packages.join(", ")}\n\n**Migration:** ${b.migration}`,
      );
    }
  }

  if (notes.byPackage.length > 0) {
    sections.push("## By Package");
    for (const pkg of notes.byPackage) {
      let bumpLabel: string;
      if (pkg.bump === "major") {
        bumpLabel = "Major";
      } else if (pkg.bump === "minor") {
        bumpLabel = "Minor";
      } else {
        bumpLabel = "Patch";
      }

      const entries = pkg.entries.map((e) => `- ${e}`).join("\n");
      sections.push(
        `### \`${pkg.name}@${pkg.version}\` (${bumpLabel})\n\n${entries}`,
      );
    }
  }

  if (notes.contributors.length > 0) {
    sections.push(
      `## Contributors\n\nThanks to ${notes.contributors.join(", ")} for contributing to this release!`,
    );
  }

  return sections.join("\n\n");
}
