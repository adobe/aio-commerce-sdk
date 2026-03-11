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

import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseReleaseChannel, runGitHubScript } from "./utils.ts";

import type { AsyncFunctionArguments, Environment } from "./types.ts";

// Find where the Changesets configuration and state files are located, relative to the current file.
const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PRE_STATE_PATH = resolve(
  CURRENT_DIR,
  "../../../../.changeset/pre.json",
);
const DEFAULT_CONFIG_PATH = resolve(
  CURRENT_DIR,
  "../../../../.changeset/config.json",
);

/** The tag for the pre-release. */
const PRE_RELEASE_TAG = "beta";

export default async function main(
  core: AsyncFunctionArguments["core"],
  exec: AsyncFunctionArguments["exec"],
) {
  return await runGitHubScript(core, async () => await prepare(core, exec));
}

/** Prepares the release by configuring the registry authentication and ensuring the Changesets is in the correct mode. */
async function prepare(
  core: AsyncFunctionArguments["core"],
  exec: AsyncFunctionArguments["exec"],
) {
  const {
    BASE_BRANCH: baseBranch,
    CHANGESET_CONFIG_PATH: configPath = DEFAULT_CONFIG_PATH,
    CHANGESET_PRE_STATE_PATH: preStatePath = DEFAULT_PRE_STATE_PATH,
    REGISTRY_URL: registryUrl,
    REGISTRY_AUTH_TOKEN: registryAuthToken,
    RELEASE_CHANNEL: releaseChannelValue,
  } = process.env as Environment;

  const releaseChannel = parseReleaseChannel(releaseChannelValue);
  const config = JSON.parse(readFileSync(configPath, "utf8")) as {
    baseBranch?: string;
  };

  // Ensure the base branch is the same as the one in the Changesets config.
  if (!config.baseBranch || config.baseBranch !== baseBranch) {
    throw new Error(
      `Expected base branch "${baseBranch}" but found "${config.baseBranch ?? ""}".`,
    );
  }

  if (releaseChannel === "internal") {
    ensureInternalPreMode(preStatePath);
  } else {
    ensurePublicExitMode(preStatePath);
  }

  await configureRegistryAuth(core, exec, {
    registryUrl,
    registryAuthToken,
    releaseChannel,
  });
}

/** Reads the pre-release mode from the Changesets state file. */
function readPreMode(path = DEFAULT_PRE_STATE_PATH) {
  if (!existsSync(path)) {
    // Changesets is not in pre-release mode.
    return null;
  }

  const preState = JSON.parse(readFileSync(path, "utf8")) as {
    mode?: string;
  };

  return preState.mode ?? null;
}

/** Ensures the Changesets is in pre-release mode. */
function ensureInternalPreMode(path = DEFAULT_PRE_STATE_PATH) {
  const mode = readPreMode(path);
  if (mode === "pre") {
    return;
  }

  if (mode === null) {
    throw new Error("Changesets is not in pre-release mode.");
  }

  throw new Error(
    [
      `Expected Changesets to be in pre-release to release to internal channel but found "${mode}".`,
      `Please enter pre-release mode with "pnpm changeset pre enter ${PRE_RELEASE_TAG}".`,
    ].join("\n"),
  );
}

/** Ensures the Changesets has exited pre-release mode. */
function ensurePublicExitMode(path = DEFAULT_PRE_STATE_PATH) {
  const mode = readPreMode(path);
  if (mode === "pre") {
    throw new Error(
      [
        `Expected Changesets to have exited pre-release to release to public channel but found "${mode}".`,
        `Please exit pre-release mode with "pnpm changeset pre exit".`,
      ].join("\n"),
    );
  }
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

  await exec.exec("npm config set registry", [data.registryUrl]);

  // Write the auth token directly to ~/.npmrc, mirroring how actions/setup-node does it.
  // npm config set is unreliable for //-prefixed registry auth keys across npm versions.
  appendFileSync(
    `${process.env.HOME}/.npmrc`,
    `\n//${normalizeRegistryPath(data.registryUrl)}/:_authToken=${data.registryAuthToken}\n`,
  );

  // Export the registry URL via the npm_config_registry env var so subsequent workflow steps inherit it.
  // npm treats any env var prefixed with npm_config_ as a config option, taking precedence over .npmrc files.
  // @see https://docs.npmjs.com/cli/using-npm/config#environment-variables
  core.exportVariable("npm_config_registry", data.registryUrl);

  if (data.releaseChannel === "internal") {
    // Diagnostic: log the authenticated user to confirm auth is working before publish.
    // Failure is intentionally swallowed — auth errors surface more clearly during publish.
    try {
      await exec.exec("pnpm whoami", [
        "--userconfig",
        `${process.env.HOME}/.npmrc`,
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
