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

import { appendFileSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseReleaseChannel, runGitHubScript } from "./utils.ts";

import type { AsyncFunctionArguments, Environment } from "./types.ts";

// Find where the Changesets configuration file is located, relative to the current file.
const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CONFIG_PATH = resolve(
  CURRENT_DIR,
  "../../../../.changeset/config.json",
);

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
    BASE_BRANCH: baseBranch,
    CHANGESET_CONFIG_PATH: configPath = DEFAULT_CONFIG_PATH,
    REGISTRY_URL: registryUrl,
    REGISTRY_AUTH_TOKEN: registryAuthToken,
    RELEASE_CHANNEL: releaseChannelValue,
  } = process.env as Environment;

  const releaseChannel = parseReleaseChannel(releaseChannelValue);

  // Validate the base branch matches the Changesets config for public releases.
  // Internal (snapshot) releases don't need this validation since they don't use changesets/action.
  if (releaseChannel === "public") {
    const config = JSON.parse(readFileSync(configPath, "utf8")) as {
      baseBranch?: string;
    };

    if (!config.baseBranch || config.baseBranch !== baseBranch) {
      throw new Error(
        `Expected base branch "${baseBranch}" but found "${config.baseBranch ?? ""}".`,
      );
    }
  }

  await configureRegistryAuth(core, exec, {
    registryUrl,
    registryAuthToken,
    releaseChannel,
  });
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
