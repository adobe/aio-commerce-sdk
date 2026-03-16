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

import { appendFileSync } from "node:fs";
import { join } from "node:path";

import { parseReleaseChannel, runGitHubScript } from "./utils.ts";

import type { AsyncFunctionArguments, Environment } from "./types.ts";

const DEFAULT_SNAPSHOT_TAG = "beta";
const STATUS_OUTPUT_FILE = "changeset-status.json";

export default async function main(
  core: AsyncFunctionArguments["core"],
  exec: AsyncFunctionArguments["exec"],
) {
  return await runGitHubScript(core, async () => await prepare(core, exec));
}

/** Prepares the release by configuring the registry authentication. */
async function prepare(
  core: AsyncFunctionArguments["core"],
  exec: AsyncFunctionArguments["exec"],
) {
  const {
    REGISTRY_URL: registryUrl,
    REGISTRY_AUTH_TOKEN: registryAuthToken,
    RELEASE_CHANNEL: releaseChannelValue,
  } = process.env as Environment;

  const releaseChannel = parseReleaseChannel(releaseChannelValue);
  const publishOnly = process.env.PUBLISH_ONLY === "true";

  if (releaseChannel === "internal" && !publishOnly) {
    await prepareSnapshot(core, exec);
  }

  await configureRegistryAuth(core, exec, {
    registryUrl,
    registryAuthToken,
    releaseChannel,
  });
}

/**
 * Prepares the snapshot release by fetching the release branch (needed for
 * changeset status comparison), generating the changeset status file, and
 * applying snapshot versions. This must run before the build step so that
 * .build/package.json files get the snapshot versions.
 */
async function prepareSnapshot(
  core: AsyncFunctionArguments["core"],
  exec: AsyncFunctionArguments["exec"],
) {
  const snapshotTag = process.env.SNAPSHOT_TAG || DEFAULT_SNAPSHOT_TAG;
  const workspaceRoot = process.env.GITHUB_WORKSPACE ?? process.cwd();
  const statusFile = join(workspaceRoot, STATUS_OUTPUT_FILE);

  // Unshallow the clone and fetch the release branch so changeset status can
  // find where HEAD diverged from baseBranch via git merge-base.
  try {
    await exec.exec("git", ["fetch", "--unshallow"]);
    await exec.exec("git", ["fetch", "origin", "release:release"]);
  } catch {
    core.warning(
      "Could not fetch release branch. Changeset status may fail if baseBranch is not available.",
    );
  }

  await exec.exec("pnpm", ["changeset", "status", "--output", statusFile]);
  core.info(`Changeset status written to ${statusFile}`);

  await exec.exec("pnpm", ["changeset", "version", "--snapshot", snapshotTag]);
  core.info(`Snapshot versions applied with tag "${snapshotTag}".`);
}

/** Normalizes the registry path by removing the protocol and trailing slashes. */
function normalizeRegistryPath(registryUrl: string) {
  const parsedUrl = new URL(registryUrl);
  const normalizedPath = parsedUrl.pathname.endsWith("/")
    ? parsedUrl.pathname.slice(0, -1)
    : parsedUrl.pathname;

  return `${parsedUrl.host}${normalizedPath}`;
}

/** Configures NPM authentication for the internal Artifactory registry */
async function configureRegistryAuth(
  core: AsyncFunctionArguments["core"],
  exec: AsyncFunctionArguments["exec"],
  data: {
    registryUrl: string;
    registryAuthToken: string;
    releaseChannel: string;
  },
) {
  if (!(data.registryUrl && data.registryAuthToken)) {
    throw new Error(
      "Missing required values for registry authentication configuration.",
    );
  }

  appendFileSync(
    `${process.env.GITHUB_WORKSPACE}/.npmrc`,
    [
      "",
      `@adobe:registry=${data.registryUrl}`,
      `//${normalizeRegistryPath(data.registryUrl)}/:_authToken=${data.registryAuthToken}`,
    ].join("\n"),
  );

  if (data.releaseChannel === "internal") {
    // Diagnostic: log the authenticated user to confirm auth is working before publish.
    // Failure is intentionally swallowed — auth errors surface more clearly during publish.
    try {
      await exec.exec("pnpm whoami", [
        "--userconfig",
        `${process.env.GITHUB_WORKSPACE}/.npmrc`,
        "--registry",
        data.registryUrl,
      ]);
    } catch (error) {
      core.warning(
        `Registry auth check failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
