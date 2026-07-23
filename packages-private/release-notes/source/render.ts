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

const REPOSITORY = "adobe/aio-commerce-sdk";
const REPOSITORY_URL = `https://github.com/${REPOSITORY}`;
const PACKAGE_BASE_URL = "https://www.npmjs.com/package";
const META_PACKAGE = "@adobe/aio-commerce-sdk";
const OWNERS = "@decepticons @mercury";
const COMPATIBILITY = ":white_check_mark: PAAS | :white_check_mark: ACCS";

export type RenderContext = {
  date: string;
  publishedPackages: ReadonlyArray<{ name: string; version: string }>;
};

/**
 * Renders a `ReleaseNotes` object as a Slack mrkdwn string.
 *
 * Render order: header > metadata > highlights > summary > links > footer.
 */
export function renderSlack(notes: ReleaseNotes, ctx: RenderContext): string {
  const lines: string[] = [];
  lines.push(
    ":mega: Adobe Commerce SDK for App Builder Release :tada:",
    "",
    `*Date:* ${ctx.date}`,
    `*Owner:* ${OWNERS}`,
    "*Status:* :white_check_mark: Released",
    `*Compatibility:* ${COMPATIBILITY}`,
    "",
  );

  if (notes.highlights.length > 0 || notes.breakingChanges.length > 0) {
    lines.push("*Highlights*", "");

    if (notes.breakingChanges.length > 0) {
      lines.push(":warning: Breaking Changes :warning:", "");
      for (const bc of notes.breakingChanges) {
        lines.push(`  - ${bc.title}`);
      }
      lines.push("");
    }

    for (const h of notes.highlights) {
      lines.push(`  - ${h.description}`);
    }
    lines.push("");
  }

  lines.push("*Why it matters*", notes.summary, "");
  const sortedPackages = [...ctx.publishedPackages].sort((a, b) => {
    if (a.name === META_PACKAGE) {
      return -1;
    }

    if (b.name === META_PACKAGE) {
      return 1;
    }

    return a.name.localeCompare(b.name);
  });

  lines.push("*Links*", `Github: <${REPOSITORY_URL}|${REPOSITORY}>`);

  for (const pkg of sortedPackages) {
    const tag = `${pkg.name}@${pkg.version}`;
    const releaseUrl = `${REPOSITORY_URL}/releases/tag/${tag}`;
    const pkgUrl = `${PACKAGE_BASE_URL}/${pkg.name}`;

    lines.push(
      `• \`${tag}\` — <${releaseUrl}|Release notes> · <${pkgUrl}|npm>`,
    );
  }

  lines.push("", ":speech_balloon: #commerce-app-mgmt for questions");
  return lines.join("\n");
}
