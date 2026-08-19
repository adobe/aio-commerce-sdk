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
import { loadPackageJson } from "@aio-commerce-sdk/scripting-utils/project";
import { consola } from "consola";

import {
  scaffoldTypeScriptProject,
  syncActionsTypecheckScript,
} from "#commands/typescript";
import { runInstall } from "#commands/utils";

import {
  ensureAppConfig,
  ensureCommerceAppConfig,
  ensureInstallYaml,
  ensurePackageJson,
  installDependencies,
  runGeneration,
  writePostinstallHook,
} from "./lib";

import type { CommerceAppConfigDomain } from "#config/index";

// Pin the self-install to the executing version so running `init` on a
// specific release doesn't silently downgrade to the latest stable.
const REQUIRED_DEPENDENCIES = [
  "@adobe/aio-commerce-sdk",
  `@adobe/aio-commerce-lib-app@${__PKG_VERSION__}`,
];

/** The flags that the `init` command should accept (useful for non-interactive). */
export type InitFlags = {
  appName: string;
  configFormat: "ts" | "js";
  domains: CommerceAppConfigDomain[];
};

/** Internal execution options for the init handler. */
type InitExtraOptions = {
  /** Whether to format a newly created app configuration. */
  formatConfig?: boolean;
  /** Working directory to initialize in. Defaults to the CWD. */
  cwd?: string;
};

/**
 * Initializes a Commerce App project.
 * @param flags - Non-interactive initialization answers.
 * @param extraOptions - Internal formatting and working-directory overrides.
 */
export async function run(flags?: InitFlags, extraOptions?: InitExtraOptions) {
  consola.start("Initializing app...");

  const cwd = extraOptions?.cwd ?? process.cwd();
  const { execCommand, packageManager, projectRoot } =
    await ensurePackageJson(cwd);

  runInstall(packageManager, REQUIRED_DEPENDENCIES, projectRoot);

  const configResult = await ensureCommerceAppConfig(
    projectRoot,
    extraOptions?.formatConfig ?? true,
    flags,
  );

  const { config, domains, configFormat } = configResult;
  const isTypeScriptProject = configFormat === "ts";

  installDependencies(packageManager, domains, projectRoot);
  if (isTypeScriptProject) {
    await scaffoldTypeScriptProject(packageManager, projectRoot);
  }

  // Sync the package.json with the app config
  const pkg = await loadPackageJson(projectRoot);
  if (pkg === null) {
    throw new Error("Could not find package.json.");
  }

  pkg.update({
    description: config.metadata.description,
    name: config.metadata.id,
    version: config.metadata.version,
  });

  await pkg.save();

  if (isTypeScriptProject) {
    await syncActionsTypecheckScript(projectRoot);
  }

  await runGeneration(config, execCommand, projectRoot);
  await ensureAppConfig(domains, projectRoot);
  await ensureInstallYaml(domains, projectRoot);

  // Register the postinstall hook last so future installs run after init has
  // created the files the hook depends on.
  await writePostinstallHook(execCommand, projectRoot);

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
