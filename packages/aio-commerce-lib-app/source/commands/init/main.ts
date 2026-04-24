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

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import NpmPackageJson from "@npmcli/package-json";
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

// __PKG_VERSION__ are injected and replaced at build time.
declare const __PKG_VERSION__: string;

// Pin the self-install to the executing version so running `init` on a
// specific release doesn't silently downgrade to the latest stable.
const REQUIRED_DEPENDENCIES = [
  "@adobe/aio-commerce-sdk",
  `@adobe/aio-commerce-lib-app@${__PKG_VERSION__}`,
];

/** Initialize the project with @adobe/aio-commerce-lib-app */
export async function exec() {
  try {
    consola.start("Initializing app...");

    const { execCommand, packageManager } = await ensurePackageJson();
    runInstall(packageManager, REQUIRED_DEPENDENCIES);

    const { config, domains } = await ensureCommerceAppConfig();
    installDependencies(packageManager, domains);

    // Sync the package.json with the app config
    const pkg = await NpmPackageJson.load(process.cwd());
    pkg.update({
      name: config.metadata.id,
      version: config.metadata.version,
      description: config.metadata.description,
    });

    await pkg.save();
    await runGeneration(config, execCommand);
    await ensureAppConfig(domains);
    await ensureInstallYaml(domains);

    // Register the postinstall hook last — the config file it depends on
    // now exists, so any future `<pm> install` will find what it needs.
    await writePostinstallHook(execCommand);

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
