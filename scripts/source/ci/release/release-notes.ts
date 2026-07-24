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

import {
  assembleReleaseNotes,
  collectEntries,
  generateAllNotes,
  renderSlack,
  selectModel,
} from "@aio-commerce-sdk/release-notes";

import { runGitHubScript } from "./utils.ts";

import type { AsyncFunctionArguments, PublishedPackage } from "./types.ts";

export default async function main(
  core: AsyncFunctionArguments["core"],
  exec: AsyncFunctionArguments["exec"],
) {
  return await runGitHubScript(core, async () => {
    const {
      RELEASE_NOTES_ENABLED,
      RELEASE_NOTES_MODEL_ENDPOINT,
      RELEASE_NOTES_MODEL,
      PUBLISHED_PACKAGES,
    } = process.env;

    if (RELEASE_NOTES_ENABLED !== "true") {
      core.info(
        "Release notes generation is disabled (RELEASE_NOTES_ENABLED != true). Skipping.",
      );
      return;
    }

    if (!PUBLISHED_PACKAGES) {
      throw new Error("Missing PUBLISHED_PACKAGES environment variable.");
    }
    if (!RELEASE_NOTES_MODEL) {
      throw new Error("Missing RELEASE_NOTES_MODEL environment variable.");
    }

    const publishedPackages = JSON.parse(
      PUBLISHED_PACKAGES,
    ) as PublishedPackage[];

    if (publishedPackages.length === 0) {
      core.info("No published packages. Skipping release notes.");
      return;
    }

    const { model, modelId } = selectModel({
      RELEASE_NOTES_MODEL,
      RELEASE_NOTES_MODEL_ENDPOINT,
    });
    core.info(`Generating release notes with model=${modelId}`);

    const entries = await collectEntries(exec, publishedPackages);
    const { results, summary, highlights, totalUsage } = await generateAllNotes(
      entries,
      model,
    );
    const notes = assembleReleaseNotes(results, summary, highlights);
    const markdown = renderSlack(notes, {
      date: new Date().toISOString().split("T")[0],
      publishedPackages,
    });

    core.info(
      `Token usage — input: ${totalUsage.inputTokens ?? 0}, output: ${totalUsage.outputTokens ?? 0}, total: ${totalUsage.totalTokens ?? 0}`,
    );

    core.setOutput("releaseNotes", JSON.stringify(notes));
    core.setOutput("releaseNotesMarkdown", markdown);

    await core.summary
      .addHeading("Release Notes Preview", 2)
      .addRaw(markdown)
      .write();

    core.info("Release notes written to job summary.");
  });
}
