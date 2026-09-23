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

/**
 * Internal App Builder hook handlers, loaded by the hook files that
 * `@adobe/aio-commerce-lib-app` generates. Not part of the public API.
 * @packageDocumentation
 */

import { existsSync } from "node:fs";
import { join } from "node:path";

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { getProjectRootDirectory } from "@aio-commerce-sdk/scripting-utils/project";
import consola from "consola";

import { getExtensionPointFolderPath } from "#commands/constants";
import { TEMPLATES_DIR } from "#commands/generate/actions/constants";
import { run as runPostAppDeploy } from "#commands/hooks/post-app-deploy/main";
import { run as runPreAppBuild } from "#commands/hooks/pre-app-build";
import { run as runPreAppDev } from "#commands/hooks/pre-app-dev";
import { run as runPreAppRun } from "#commands/hooks/pre-app-run";

import type { Extension } from "#commands/hooks/pre-app-build";

const USER_HOOKS_DIR = "hooks";
const USER_HOOK_FILE_EXTENSIONS = [
  ".ts",
  ".mts",
  ".cts",
  ".js",
  ".mjs",
  ".cjs",
];

// `aio app run` fires `pre-app-build` while building actions, right before it
// bundles the dev server, which must keep the development `NODE_ENV`.
let isDevSession = false;

/**
 * Finds the user hook file for a hook, looking in the extension point's `hooks`
 * folder first and then in the project root `hooks` folder.
 *
 * @param projectRoot - Resolved project root.
 * @param extensionPointId - The extension point ID, e.g. "commerce/backend-ui/2".
 * @param hookName - The hook name, e.g. "pre-app-build".
 */
function findUserHook(
  projectRoot: string,
  extensionPointId: string,
  hookName: string,
) {
  const dirs = [
    join(
      projectRoot,
      getExtensionPointFolderPath(extensionPointId),
      USER_HOOKS_DIR,
    ),
    join(projectRoot, USER_HOOKS_DIR),
  ];

  for (const dir of dirs) {
    const matches = USER_HOOK_FILE_EXTENSIONS.map((extension) =>
      join(dir, `${hookName}${extension}`),
    ).filter((file) => existsSync(file));

    if (matches.length > 1) {
      throw new Error(
        `Found more than one "${hookName}" hook file in ${dir}: ${matches.join(", ")}. Keep only one.`,
      );
    }

    if (matches.length === 1) {
      return matches[0];
    }
  }

  return null;
}

/**
 * Runs the user hook file for a hook, if there is one.
 *
 * @param projectRoot - Resolved project root.
 * @param hookName - The hook name, e.g. "pre-app-build".
 * @param extension - The extension the hook is registered for.
 * @param hookArgs - The argument the aio CLI passed to the hook.
 */
async function runUserHook(
  projectRoot: string,
  hookName: string,
  extension: Extension,
  hookArgs: unknown,
) {
  const extensionPoint = `commerce/${extension}`;
  const file = findUserHook(projectRoot, extensionPoint, hookName);
  if (!file) {
    return;
  }

  const { createJiti } = await import("jiti");
  const hook = await createJiti(import.meta.url).import(file, {
    default: true,
  });

  if (typeof hook !== "function") {
    throw new Error(`${file} must export a function as its default export.`);
  }

  await hook(hookArgs, { extensionPoint });
}

/**
 * Creates an async App Builder hook that runs the given function and then the
 * user hook file, logging any error and exiting the process with code 1.
 *
 * @param hookName - The hook name, e.g. "pre-app-build".
 * @param extension - The extension the hook is registered for.
 * @param fn - The hook implementation.
 */
function createHook(
  hookName: string,
  extension: Extension,
  fn: (projectRoot: string) => Promise<unknown>,
) {
  return async (hookArgs?: unknown) => {
    try {
      const projectRoot = await getProjectRootDirectory();
      await fn(projectRoot);
      await runUserHook(projectRoot, hookName, extension, hookArgs);
    } catch (error) {
      if (error instanceof CommerceSdkValidationError) {
        consola.error(error.display());
      } else {
        consola.error(error);
      }

      // The aio CLI only logs hook rejections and carries on.
      process.exit(1);
    }
  };
}

/**
 * Creates the `pre-app-build` hook for the given extension.
 * @param extension - The extension the hook is registered for.
 */
export function preAppBuild(extension: Extension) {
  return createHook("pre-app-build", extension, (projectRoot) =>
    runPreAppBuild(extension, projectRoot, TEMPLATES_DIR, { isDevSession }),
  );
}

/**
 * Creates the `pre-app-run` hook for the given extension.
 * @param extension - The extension the hook is registered for.
 */
export function preAppRun(extension: Extension) {
  return createHook("pre-app-run", extension, (projectRoot) => {
    isDevSession = true;
    return runPreAppRun(projectRoot);
  });
}

/**
 * Creates the `pre-app-dev` hook for the given extension.
 * @param extension - The extension the hook is registered for.
 */
export function preAppDev(extension: Extension) {
  return createHook("pre-app-dev", extension, (projectRoot) => {
    isDevSession = true;
    return runPreAppDev(projectRoot);
  });
}

/**
 * Creates the `post-app-deploy` hook for the given extension.
 * @param extension - The extension the hook is registered for.
 */
export function postAppDeploy(extension: Extension) {
  return createHook("post-app-deploy", extension, () => runPostAppDeploy());
}
