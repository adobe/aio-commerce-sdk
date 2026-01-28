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
  ensureCommerceAppConfig,
  ensureEnvFile,
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
      makeStep("ensureExtensibilityConfig", ensureCommerceAppConfig),
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
        process.exit(1);
      }

      // Empty line between steps
      consola.log.raw("");
    }

    consola.success("Initialization complete!");
    consola.box(
      ["Next steps:", "  - Review and customize app.commerce.config.js"].join(
        "\n",
      ),
    );
  } catch (error) {
    consola.error(stringifyError(error));
    process.exit(1);
  }
}
