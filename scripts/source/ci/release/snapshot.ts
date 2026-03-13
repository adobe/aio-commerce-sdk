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

  // 2. Resolve workspace package paths (needed for reading package.json and CHANGELOG.md).
  const workspacePackages = await getWorkspacePackages(exec);

  // 3. Apply snapshot versions (modifies package.json files in-place, not committed).
  await exec.exec("pnpm changeset version", ["--snapshot", SNAPSHOT_TAG]);

  // 4. Read actual snapshot versions for packages the release plan says will change.
  const publishedPackages = getSnapshotVersions(releasePlan, workspacePackages);
  if (publishedPackages.length === 0) {
    core.info("No packages were versioned. Skipping publish.");
    core.setOutput("published", "false");
    core.setOutput("publishedPackages", "[]");
    return;
  }

  // 5. Publish snapshot packages to registry.
  await exec.exec("pnpm changeset publish", ["--tag", SNAPSHOT_TAG]);

  // 6. Create per-package GitHub pre-releases with changelog-based release notes.
  for (const pkg of publishedPackages) {
    const workspace = workspacePackages.get(pkg.name);
    if (!workspace) {
      continue;
    }

    const changelog = readChangelogSection(workspace.path, pkg.version);
    const body = formatPreReleaseBody(changelog, pkg);
    const tag = `${pkg.name}@${pkg.version}`;

    try {
      await github.rest.repos.createRelease({
        body,
        name: tag,
        owner: context.repo.owner,
        prerelease: true,
        repo: context.repo.repo,
        tag_name: tag,
        target_commitish: context.sha,
      });
      core.info(`Created GitHub pre-release: ${tag}`);
    } catch (error) {
      core.warning(
        `Failed to create pre-release for ${pkg.name}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
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
    packages
      .filter((p): p is WorkspacePackage => Boolean(p.name && p.path))
      .map((p) => [p.name, p]),
  );
}

/** Reads actual snapshot versions from package.json for packages the release plan says will change. */
function getSnapshotVersions(
  releasePlan: ChangesetStatus,
  workspacePackages: Map<string, WorkspacePackage>,
): PublishedPackage[] {
  const packages: PublishedPackage[] = [];

  for (const release of releasePlan.releases) {
    if (release.type === "none") {
      continue;
    }

    const workspace = workspacePackages.get(release.name);
    if (!workspace) {
      continue;
    }

    try {
      const pkgJson = JSON.parse(
        readFileSync(join(workspace.path, "package.json"), "utf8"),
      ) as { version: string };

      packages.push({ name: release.name, version: pkgJson.version });
    } catch {
      // Skip packages whose package.json can't be read.
    }
  }

  return packages;
}

/** Reads the changelog section for a specific version from a package's CHANGELOG.md. */
function readChangelogSection(
  packagePath: string,
  version: string,
): string | null {
  try {
    const content = readFileSync(join(packagePath, "CHANGELOG.md"), "utf8");
    const versionHeading = `## ${version}`;
    const startIndex = content.indexOf(versionHeading);
    if (startIndex === -1) {
      return null;
    }

    const sectionStart = startIndex + versionHeading.length;
    const nextHeading = content.indexOf("\n## ", sectionStart);
    const section =
      nextHeading === -1
        ? content.slice(sectionStart)
        : content.slice(sectionStart, nextHeading);

    return section.trim() || null;
  } catch {
    return null;
  }
}

/** Formats the body for a GitHub pre-release, with a notice and changelog content. */
function formatPreReleaseBody(
  changelog: string | null,
  pkg: PublishedPackage,
): string {
  const lines = [
    "> [!IMPORTANT]",
    "> Internal release only. This version is not publicly available.",
    "",
    changelog ?? `Snapshot release of \`${pkg.name}@${pkg.version}\`.`,
  ];

  return lines.join("\n");
}
