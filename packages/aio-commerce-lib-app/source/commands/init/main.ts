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
import { getProjectRootDirectory } from "@aio-commerce-sdk/scripting-utils/project";
import { consola } from "consola";

import {
  ensureAppConfig,
  ensureCommerceAppConfig,
  ensureInstallYaml,
  ensurePackageJson,
  installDependencies,
  runGeneration,
  runInstall,
  writePostinstallHook,
} from "./lib";

import type { CommerceAppConfigDomain } from "#config/index";

// Injected by tsdown / vitest at build time via `define`.
declare const __PKG_VERSION__: string;

// Pin the self-install to the executing version so running `init` on a
// specific release doesn't silently downgrade to the latest stable.
const REQUIRED_DEPENDENCIES = [
  `@adobe/aio-commerce-lib-app@${__PKG_VERSION__}`,
  "@adobe/aio-commerce-sdk",
];

/** The flags that the `init` command should accept (useful for non-interactive). */
export type InitFlags = {
  appName: string;
  configFormat: "ts" | "js";
  domains: CommerceAppConfigDomain[];
};

/** Extra options that can be given to the `init` handler that would not necessarily become CLI flags. */
type InitExtraOptions = {
  formatConfig?: boolean;
};

/** Initialize the project */
export async function run(flags?: InitFlags, extraOptions?: InitExtraOptions) {
  consola.start("Initializing app...");

  const { execCommand, packageManager } = await ensurePackageJson();
  runInstall(packageManager, REQUIRED_DEPENDENCIES);

  const projectDir = await getProjectRootDirectory();
  const { config, domains } = await ensureCommerceAppConfig(
    projectDir,
    extraOptions?.formatConfig ?? true,
    flags,
  );

  installDependencies(packageManager, domains);

  // Sync the package.json with the app config
  execSync(`npm pkg set name="${config.metadata.id}"`);
  execSync(`npm pkg set version="${config.metadata.version}"`);
  execSync(`npm pkg set description="${config.metadata.description}"`);

  await runGeneration(config, execCommand);
  await ensureAppConfig(domains);
  await ensureInstallYaml(domains);

  // Register the postinstall hook last so future installs run after init has
  // created the files the hook depends on.
  writePostinstallHook(execCommand);

  consola.success("Initialization complete!");
  consola.box(
    [
      "Next steps:",
      "  - Review and customize app.commerce.config.*",
      "  - Build and deploy your app",
    ].join("\n"),
  );
}

/** Run the init command */
export async function exec() {
  try {
    await run();
  } catch (error) {
    if (error instanceof CommerceSdkValidationError) {
      consola.error(error.display());
    } else {
      consola.error(error);
    }
    process.exit(1);
  }
}
