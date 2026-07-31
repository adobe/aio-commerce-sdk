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

import { existsSync } from "node:fs";
import { copyFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  appendCommand,
  detectPackageManager,
  getPackageDependencyInstallPlan,
  getProjectRootDirectory,
  getRunScriptCommand,
  loadPackageJson,
} from "@aio-commerce-sdk/scripting-utils/project";
import { consola } from "consola";

import {
  BACKEND_UI_V2_EXTENSION_POINT_ID,
  getExtensionPointFolderPath,
  SHARED_TYPESCRIPT_DEV_DEPENDENCIES,
  TYPESCRIPT_WEBPACK_DEV_DEPENDENCY,
} from "#commands/constants";
import { TEMPLATES_DIR } from "#commands/generate/actions/constants";
import { runInstall } from "#commands/utils";

import type {
  PackageDependency,
  PackageManager,
} from "@aio-commerce-sdk/scripting-utils/project";

const WEBPACK_CONFIG_PATTERN = /^webpack-config\.(?:cjs|js)$/u;
const WEBPACK_CONFIG_FILE = "webpack-config.cjs";
const TSCONFIG_FILE = "tsconfig.json";
const ROOT_TYPESCRIPT_CONFIG = {
  compilerOptions: {
    allowJs: true,
    checkJs: true,
    module: "esnext",
    moduleResolution: "bundler",
  },
  exclude: ["src/**/web-src/**"],
  extends: [
    "@tsconfig/bases/recommended",
    "@tsconfig/bases/node-ts",
    "@tsconfig/bases/node24",
  ],
  include: [
    "src/**/.generated/actions/**/*.js",
    "app.commerce.config.ts",
    "app.commerce.config.mts",
    "app.commerce.config.cts",
    "src/**/*.ts",
    "src/**/*.mts",
    "src/**/*.cts",
  ],
};

const TYPESCRIPT_DEV_DEPENDENCIES = [
  ...SHARED_TYPESCRIPT_DEV_DEPENDENCIES,
  TYPESCRIPT_WEBPACK_DEV_DEPENDENCY,
] as const satisfies readonly PackageDependency[];

const ACTIONS_TYPECHECK_SCRIPT = "typecheck:actions";
const WEB_SOURCE_TYPECHECK_SCRIPT = "typecheck:web-src";
const ACTIONS_TYPECHECK_COMMAND = "tsc --noEmit -p tsconfig.json";

const WEB_SOURCE_TSCONFIG_PATH = `${getExtensionPointFolderPath(
  BACKEND_UI_V2_EXTENSION_POINT_ID,
)}/web-src/tsconfig.json`;

const WEB_SOURCE_TYPECHECK_COMMAND = `tsc --noEmit -p ${WEB_SOURCE_TSCONFIG_PATH}`;

/**
 * Create the default Webpack configuration when the project has none.
 * @param projectRoot Project root directory.
 */
async function scaffoldWebpackConfig(projectRoot: string) {
  const entries = await readdir(projectRoot, { withFileTypes: true });
  const existingConfig = entries.find(
    (entry) => entry.isFile() && WEBPACK_CONFIG_PATTERN.test(entry.name),
  );

  if (existingConfig !== undefined) {
    consola.info(`Found ${existingConfig.name}; leaving it unchanged.`);
    return;
  }

  await copyFile(
    join(TEMPLATES_DIR, "typescript", WEBPACK_CONFIG_FILE),
    join(projectRoot, WEBPACK_CONFIG_FILE),
  );
}

/**
 * Create the Runtime actions TypeScript configuration when it does not exist.
 * @param projectRoot Project root directory.
 */
async function scaffoldTypeScriptConfig(projectRoot: string) {
  const rootConfigPath = join(projectRoot, TSCONFIG_FILE);
  if (!existsSync(rootConfigPath)) {
    await writeFile(
      rootConfigPath,
      `${JSON.stringify(ROOT_TYPESCRIPT_CONFIG, null, 2)}\n`,
      "utf-8",
    );
  }
}

/**
 * Install missing TypeScript tooling after validating installed versions.
 * @param packageManager Package manager used by the project.
 * @param projectRoot Project root directory.
 */
async function installTypeScriptDependencies(
  packageManager: PackageManager,
  projectRoot: string,
) {
  const installPlan = await getPackageDependencyInstallPlan(
    TYPESCRIPT_DEV_DEPENDENCIES,
    projectRoot,
  );

  if (installPlan.incompatible.length > 0) {
    const dependencies = installPlan.incompatible
      .map(
        ({ name, version, installedVersion }) =>
          `${name}@${installedVersion} does not satisfy ${version}`,
      )
      .join("\n");

    throw new Error(
      `Cannot configure TypeScript because installed dependencies are incompatible:\n${dependencies}`,
    );
  }

  runInstall(
    packageManager,
    installPlan.missing.map(({ name, version }) => `${name}@${version}`),
    projectRoot,
    { dev: true },
  );
}

/**
 * Scaffold the files and dependencies for a new TypeScript Commerce project.
 * @param packageManager Package manager used by the initialized project.
 * @param cwd Directory within the App Builder project.
 */
export async function scaffoldTypeScriptProject(
  packageManager: PackageManager,
  cwd = process.cwd(),
) {
  const projectRoot = await getProjectRootDirectory(cwd);
  await scaffoldWebpackConfig(projectRoot);
  await scaffoldTypeScriptConfig(projectRoot);
  await installTypeScriptDependencies(packageManager, projectRoot);
}

/**
 * Add a generated typecheck script and compose it into the root typecheck script.
 * @param scriptName Generated package script name.
 * @param command TypeScript command run by the generated script.
 * @param cwd Directory within the App Builder project.
 */
async function syncTypecheckScript(
  scriptName:
    | typeof ACTIONS_TYPECHECK_SCRIPT
    | typeof WEB_SOURCE_TYPECHECK_SCRIPT,
  command: string,
  cwd: string,
) {
  const projectRoot = await getProjectRootDirectory(cwd);
  const pkg = await loadPackageJson(projectRoot);
  if (pkg === null) {
    throw new Error("Could not find package.json.");
  }

  const scripts = {
    ...pkg.content.scripts,
    [scriptName]: command,
  };
  const packageManager = await detectPackageManager(projectRoot);
  const typecheck = appendCommand(
    scripts.typecheck,
    getRunScriptCommand(packageManager, scriptName),
  );

  pkg.update({
    scripts: {
      ...scripts,
      typecheck,
    },
  });

  await pkg.save();
}

/**
 * Add the Runtime actions typecheck script to a project.
 * @param cwd Directory within the App Builder project.
 */
export async function syncActionsTypecheckScript(cwd = process.cwd()) {
  await syncTypecheckScript(
    ACTIONS_TYPECHECK_SCRIPT,
    ACTIONS_TYPECHECK_COMMAND,
    cwd,
  );
}

/**
 * Add the web-src typecheck script to a project.
 * @param cwd Directory within the App Builder project.
 */
export async function syncWebSourceTypecheckScript(cwd = process.cwd()) {
  await syncTypecheckScript(
    WEB_SOURCE_TYPECHECK_SCRIPT,
    WEB_SOURCE_TYPECHECK_COMMAND,
    cwd,
  );
}
