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

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { getProjectRootDirectory } from "@aio-commerce-sdk/scripting-utils/project";
import consola from "consola";

import { TEMPLATES_DIR } from "#commands/generate/actions/constants";
import { run as runPostAppDeploy } from "#commands/hooks/post-app-deploy/main";
import { run as runPreAppBuild } from "#commands/hooks/pre-app-build";
import { run as runPreAppDev } from "#commands/hooks/pre-app-dev";
import { run as runPreAppRun } from "#commands/hooks/pre-app-run";

import type { Extension } from "#commands/hooks/pre-app-build";

// `aio app run` fires `pre-app-build` while building actions, right before it
// bundles the dev server, which must keep the development `NODE_ENV`.
let isDevSession = false;

/**
 * Creates an async App Builder hook that runs the given function, logging any
 * error and exiting the process with code 1.
 *
 * @param fn - The hook implementation.
 */
function createHook(fn: () => Promise<unknown>) {
  return async () => {
    try {
      await fn();
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
  return createHook(async () => {
    const projectRoot = await getProjectRootDirectory();
    await runPreAppBuild(extension, projectRoot, TEMPLATES_DIR, {
      isDevSession,
    });
  });
}

/** Creates the `pre-app-run` hook. */
export function preAppRun() {
  return createHook(async () => {
    isDevSession = true;
    await runPreAppRun(await getProjectRootDirectory());
  });
}

/** Creates the `pre-app-dev` hook. */
export function preAppDev() {
  return createHook(async () => {
    isDevSession = true;
    await runPreAppDev(await getProjectRootDirectory());
  });
}

/** Creates the `post-app-deploy` hook. */
export function postAppDeploy() {
  return createHook(runPostAppDeploy);
}
