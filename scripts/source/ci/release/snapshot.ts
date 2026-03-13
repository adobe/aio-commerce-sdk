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

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { runGitHubScript } from "./utils.ts";

import type { AsyncFunctionArguments, PublishedPackage } from "./types.ts";

const SNAPSHOT_TAG = "beta";
const STATUS_OUTPUT_FILE = "changeset-status.json";

/** Structured output from `changeset status --output`. */
interface ChangesetStatus {
  changesets: Array<{
    id: string;
    releases: Array<{ name: string; type: string }>;
    summary: string;
  }>;
  releases: Array<{
    changesets: string[];
    name: string;
    newVersion: string;
    oldVersion: string;
    type: string;
  }>;
}

/** Workspace package info from `pnpm ls`. */
interface WorkspacePackage {
  name: string;
  path: string;
  version: string;
}

export default async function main(
  core: AsyncFunctionArguments["core"],
  exec: AsyncFunctionArguments["exec"],
  github: AsyncFunctionArguments["github"],
  context: AsyncFunctionArguments["context"],
) {
  return await runGitHubScript(core, async () => {
    await snapshot(core, exec, github, context);
  });
}

/** Runs the snapshot versioning, publishing, and GitHub pre-release creation. */
async function snapshot(
  core: AsyncFunctionArguments["core"],
  exec: AsyncFunctionArguments["exec"],
  github: AsyncFunctionArguments["github"],
  context: AsyncFunctionArguments["context"],
) {
  // 1. Get structured release plan via the changeset CLI.
  const statusFile = join(
    process.env.GITHUB_WORKSPACE ?? process.cwd(),
    STATUS_OUTPUT_FILE,
  );
  await exec.exec("pnpm changeset status", ["--output", statusFile]);

  const releasePlan = JSON.parse(
    readFileSync(statusFile, "utf8"),
  ) as ChangesetStatus;

  if (releasePlan.changesets.length === 0) {
    core.info("No pending changesets. Skipping snapshot release.");
    core.setOutput("published", "false");
    core.setOutput("publishedPackages", "[]");
    return;
  }

  core.info(`Found ${releasePlan.changesets.length} pending changeset(s).`);

  const workspacePackages = await getWorkspacePackages(exec);
  await exec.exec("pnpm changeset version", ["--snapshot", SNAPSHOT_TAG]);

  // 4. Detect which packages got new snapshot versions by comparing with originals.
  const publishedPackages = detectVersionChanges(workspacePackages);
  if (publishedPackages.length === 0) {
    core.info("No packages were versioned. Skipping publish.");
    core.setOutput("published", "false");
    core.setOutput("publishedPackages", "[]");
    return;
  }

  // 5. Publish snapshot packages to registry.
  await exec.exec("pnpm changeset publish", ["--tag", SNAPSHOT_TAG]);

  // 6. Create a consolidated GitHub pre-release with release notes.
  const releaseNotes = formatReleaseNotes(releasePlan, publishedPackages);
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
  const timeStr = now
    .toISOString()
    .split("T")[1]
    .replace(/[:.]/g, "")
    .slice(0, 6);
  const tagName = `${SNAPSHOT_TAG}-${dateStr}T${timeStr}`;

  try {
    await github.rest.repos.createRelease({
      body: releaseNotes,
      name: `Beta Snapshot (${now.toISOString().split("T")[0]})`,
      owner: context.repo.owner,
      prerelease: true,
      repo: context.repo.repo,
      tag_name: tagName,
      target_commitish: context.sha,
    });
    core.info(`Created GitHub pre-release: ${tagName}`);
  } catch (error) {
    core.warning(
      `Failed to create GitHub pre-release: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // 7. Set outputs matching the changesets/action contract.
  core.setOutput("published", "true");
  core.setOutput("publishedPackages", JSON.stringify(publishedPackages));

  core.info(
    `Published ${publishedPackages.length} snapshot package(s): ${publishedPackages.map((p) => `${p.name}@${p.version}`).join(", ")}`,
  );
}

/** Gets all workspace packages with their paths and current versions via pnpm. */
async function getWorkspacePackages(
  exec: AsyncFunctionArguments["exec"],
): Promise<Map<string, WorkspacePackage>> {
  const { stdout } = await exec.getExecOutput("pnpm ls", [
    "-r",
    "--json",
    "--depth",
    "-1",
  ]);

  const packages = JSON.parse(stdout) as WorkspacePackage[];
  return new Map(
    packages.filter((p) => p.name && p.path).map((p) => [p.name, p]),
  );
}

/** Compares package.json versions after snapshot versioning to detect which packages changed. */
function detectVersionChanges(
  originalPackages: Map<string, WorkspacePackage>,
): PublishedPackage[] {
  const changed: PublishedPackage[] = [];

  for (const [name, original] of originalPackages) {
    const pkgJsonPath = join(original.path, "package.json");

    try {
      const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf8")) as {
        private?: boolean;
        version: string;
      };

      if (pkgJson.private) {
        continue;
      }

      if (pkgJson.version !== original.version) {
        changed.push({ name, version: pkgJson.version });
      }
    } catch {
      // Skip packages whose package.json can't be read.
    }
  }

  return changed;
}

/** Formats release notes from the changeset status output and published packages. */
function formatReleaseNotes(
  status: ChangesetStatus,
  publishedPackages: PublishedPackage[],
): string {
  const lines: string[] = [];

  lines.push(
    "> [!IMPORTANT]",
    "> Internal release only. This version is not publicly available.",
    "",
  );

  lines.push("## Published Packages\n");
  for (const pkg of publishedPackages) {
    lines.push(`- \`${pkg.name}@${pkg.version}\``);
  }

  lines.push("\n## Changes\n");
  for (const changeset of status.changesets) {
    const packageList = changeset.releases
      .map((r) => `\`${r.name}\` (${r.type})`)
      .join(", ");

    lines.push(`### ${packageList}\n`);
    lines.push(changeset.summary);
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
