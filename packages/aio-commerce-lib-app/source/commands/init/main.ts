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

import { execSync } from "node:child_process";

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { consola } from "consola";

import {
  ensureAppConfig,
  ensureCommerceAppConfig,
  ensureInstallYaml,
  ensurePackageJson,
  installDependencies,
  runGeneration,
  runInstall,
} from "./lib";

const REQUIRED_DEPENDENCIES = [
  "@adobe/aio-commerce-lib-app",
  "@adobe/aio-commerce-sdk",
];

/** Initialize the project with @adobe/aio-commerce-lib-config */
export async function exec() {
  try {
    consola.start("Initializing app...");

    const { execCommand, packageManager } = await ensurePackageJson();
    runInstall(packageManager, REQUIRED_DEPENDENCIES);

    const { config, domains } = await ensureCommerceAppConfig();
    installDependencies(packageManager, domains);

    // Sync the package.json with the app config
    execSync(`npm pkg set name="${config.metadata.id}"`);
    execSync(`npm pkg set version="${config.metadata.version}"`);
    execSync(`npm pkg set description="${config.metadata.description}"`);

    await runGeneration(config, execCommand);
    await ensureAppConfig(domains);
    await ensureInstallYaml(domains);

    consola.success("Initialization complete!");
    consola.box(
      [
        "Next steps:",
        "  - Review and customize app.commerce.config.*",
        "  - Build and deploy your app",
      ].join("\n"),
    );
  } catch (error) {
    if (error instanceof CommerceSdkValidationError) {
      consola.error(error.display());
    }

    consola.error(error);
    process.exit(1);
  }
}
