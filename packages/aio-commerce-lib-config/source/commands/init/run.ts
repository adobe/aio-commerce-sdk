/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";
import {
  detectPackageManager,
  getExecCommand,
} from "@aio-commerce-sdk/scripting-utils/project";
import { consola } from "consola";

import {
  ensureAppConfig,
  ensureEnvFile,
  ensureExtensibilityConfig,
  ensureInstallYaml,
  ensurePackageJsonScript,
  installDependencies,
  runGeneration,
} from "./lib";

function makeStep<T extends (...args: Parameters<T>) => ReturnType<T>>(
  name: string,
  fn: T,
  ...args: Parameters<T>
) {
  return { name, fn: () => fn(...args) };
}

/** Initialize the project with @adobe/aio-commerce-lib-config */
export async function run() {
  try {
    consola.start("Initializing @adobe/aio-commerce-lib-config...");

    const packageManager = await detectPackageManager();
    const execCommand = getExecCommand(packageManager);

    const steps = [
      makeStep("ensureExtensibilityConfig", ensureExtensibilityConfig),
      makeStep("ensurePackageJsonScript", ensurePackageJsonScript, execCommand),
      makeStep("installDependencies", installDependencies, packageManager),
      makeStep("runGeneration", runGeneration),
      makeStep("ensureAppConfig", ensureAppConfig),
      makeStep("ensureInstallYaml", ensureInstallYaml),
      makeStep("ensureEnvFile", ensureEnvFile),
    ];

    for (const step of steps) {
      const { name, fn } = step;
      const result = await fn();

      if (!result) {
        consola.error(`Initialization failed at step: ${name}`);
        throw new Error(`Initialization failed at step: ${name}`);
      }
    }

    consola.success("Initialization complete!");
    consola.box(
      "Next steps:\n" +
        "   1. Review and customize extensibility.config.js\n" +
        "   2. Fill in the required values in your .env file\n",
    );
  } catch (error) {
    if (error instanceof Error) {
      consola.fatal(error);
    } else {
      consola.fatal(new Error(stringifyError(error), { cause: error }));
    }
  }
}
