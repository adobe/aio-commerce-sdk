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
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";

import {
  detectPackageManager,
  getPackageDependencyInstallPlan,
  loadPackageJson,
  mergePackageJsonDependencies,
} from "@aio-commerce-sdk/scripting-utils/project";
import { consola } from "consola";
import { formatTree } from "consola/utils";

import {
  BACKEND_UI_V2_EXTENSION_POINT_ID,
  getExtensionPointFolderPath,
  SHARED_TYPESCRIPT_DEV_DEPENDENCIES,
} from "#commands/constants";
import { TEMPLATES_DIR } from "#commands/generate/actions/constants";
import { syncWebSourceTypecheckScript } from "#commands/typescript";
import { runProjectInstall } from "#commands/utils";
import { isTypeScriptConfig, resolveCommerceAppConfig } from "#config/index";

import type { ExtConfig } from "@aio-commerce-sdk/scripting-utils/yaml";

type WebSourceExtension = "jsx" | "tsx";

const JSX_FILE_EXTENSION = ".jsx";
const TSX_FILE_EXTENSION = ".tsx";
const APP_TITLE_PLACEHOLDER = "APP_TITLE";
const WEB_SOURCE_ENTRYPOINT_FILE = "index.html";
const WEB_SOURCE_IMPORT_ALIAS = "#web/*";
const WEB_SOURCE_TSCONFIG_FILE = "tsconfig.json";
const LEADING_DOT_SLASH_PATTERN = /^\.\//u;

/** Runtime dependencies required by the generated web-src app. */
export const WEB_SOURCE_DEPENDENCIES = [
  {
    name: "@adobe/aio-commerce-lib-admin-ui",
    version: __LIB_ADMIN_UI_RANGE__,
  },
  { name: "react", version: __REACT_VERSION__ },
  { name: "react-dom", version: __REACT_DOM_VERSION__ },
  { name: "@react-spectrum/s2", version: __SPECTRUM_S2_VERSION__ },
] as const;

/** Development dependencies required by the generated web-src app. */
export const WEB_SOURCE_DEV_DEPENDENCIES = [
  { name: "@types/react", version: __REACT_TYPES_VERSION__ },
  { name: "@types/react-dom", version: __REACT_DOM_TYPES_VERSION__ },
] as const;

const WEB_SOURCE_SHARED_BUNDLES = [
  {
    assets: [
      "**/@react-spectrum/s2/**",
      "src/commerce-backend-ui-2/web-src/*.{js,jsx,ts,tsx}",
    ],
    name: "s2-styles",
    types: ["css"],
  },
];

const WEB_SOURCE_TYPESCRIPT_CONFIG = {
  compilerOptions: {
    allowImportingTsExtensions: true,
    allowJs: true,
    checkJs: true,
    jsx: "react-jsx",
    jsxImportSource: "react",
    module: "esnext",
    moduleResolution: "bundler",
    noEmit: true,
    rewriteRelativeImportExtensions: false,
  },
  extends: ["@tsconfig/bases/recommended"],
  include: ["src/**/*.js", "src/**/*.ts", "src/**/*.tsx", "src/**/*.jsx"],
};

/** Normalize a generated file path for package.json imports. */
function normalizePackageJsonPath(path: string) {
  const normalizedPath = path.split(sep).join("/");
  const importPath = normalizedPath.startsWith(".")
    ? normalizedPath
    : `./${normalizedPath}`;
  return importPath.replace(LEADING_DOT_SLASH_PATTERN, "./");
}

/**
 * Resolve the generated web-src entrypoint path from an extension config.
 * @param extConfig - Extension config containing the view operation.
 */
function getWebSourceEntrypoint(extConfig: ExtConfig) {
  const viewEntrypoint = extConfig.operations?.view?.[0]?.impl;
  if (viewEntrypoint === undefined) {
    return null;
  }

  return join(
    getExtensionPointFolderPath(BACKEND_UI_V2_EXTENSION_POINT_ID),
    extConfig.web ?? "web-src",
    viewEntrypoint,
  );
}

/**
 * Ensure package.json has the dependencies and Parcel config needed by web-src.
 * @param projectRoot - Resolved project root containing package.json.
 * @param extension - Web source extension whose tooling is configured.
 */
async function prepareWebSourcePackage(
  projectRoot: string,
  extension: WebSourceExtension,
) {
  const pkg = await loadPackageJson(projectRoot);
  if (pkg === null) {
    throw new Error("Could not find package.json.");
  }

  const requiredDevDependencies = [
    ...WEB_SOURCE_DEV_DEPENDENCIES,
    ...(extension === "tsx" ? SHARED_TYPESCRIPT_DEV_DEPENDENCIES : []),
  ];

  const installPlan = await getPackageDependencyInstallPlan(
    [...WEB_SOURCE_DEPENDENCIES, ...requiredDevDependencies],
    projectRoot,
  );

  if (installPlan.incompatible.length > 0) {
    const incompatibleDependencies = installPlan.incompatible
      .map(
        ({ name, version, installedVersion }) =>
          `${name}@${installedVersion} does not satisfy ${version}`,
      )
      .join("\n");

    throw new Error(
      `Cannot scaffold web-src because installed dependencies are incompatible:\n${incompatibleDependencies}`,
    );
  }

  const dependencies = pkg.content.dependencies ?? {};
  const devDependencies = pkg.content.devDependencies ?? {};
  const dependencyMaps = [dependencies, devDependencies];
  const declaredDependencyNames = new Set(
    dependencyMaps.flatMap((depMap) => Object.keys(depMap)),
  );

  const dependenciesToDeclare = [
    ...WEB_SOURCE_DEPENDENCIES,
    ...requiredDevDependencies,
  ].filter(({ name }) => !declaredDependencyNames.has(name));

  if (dependenciesToDeclare.length > 0) {
    consola.info("Adding web-src dependencies in package.json:");
    consola.log.raw(
      formatTree(
        dependenciesToDeclare.map(({ name, version }) => ` ${name}@${version}`),
      ),
    );
  } else {
    consola.info("web-src dependencies are already declared in package.json.");
  }

  pkg.update({
    // Required as per Spectrum S2 documentation: https://react-spectrum.adobe.com/getting-started#framework-setup
    "@parcel/bundler-default": {
      ...(pkg.content["@parcel/bundler-default"] as Record<string, unknown>),
      manualSharedBundles: WEB_SOURCE_SHARED_BUNDLES,
    },
    // Required otherwise Parcel will fail when using our deps which export ESM.
    "@parcel/resolver-default": {
      ...(pkg.content["@parcel/resolver-default"] as Record<string, unknown>),
      packageExports: true,
    },
    dependencies: mergePackageJsonDependencies(
      dependencies,
      WEB_SOURCE_DEPENDENCIES,
      dependencyMaps,
    ),
    devDependencies: mergePackageJsonDependencies(
      devDependencies,
      requiredDevDependencies,
      dependencyMaps,
    ),
  });

  await pkg.save();

  if (installPlan.missing.length === 0) {
    consola.info("web-src dependencies are already installed.");
    return;
  }

  consola.info("Installing missing web-src dependencies from package.json:");
  consola.log.raw(
    formatTree(
      installPlan.missing.map(({ name, version }) => ` ${name}@${version}`),
    ),
  );
  const packageManager = await detectPackageManager(projectRoot);
  runProjectInstall(packageManager, projectRoot);
}

/**
 * Add the package import alias for an existing or generated web-src.
 * @param extConfig - Extension config containing the view operation.
 * @param projectRoot - Resolved project root containing package.json.
 */
export async function prepareWebSourceImportAlias(
  extConfig: ExtConfig,
  projectRoot: string,
) {
  const entrypoint = getWebSourceEntrypoint(extConfig);
  if (entrypoint === null) {
    return;
  }

  const pkg = await loadPackageJson(projectRoot);
  if (pkg === null) {
    throw new Error("Could not find package.json.");
  }

  const existingImports =
    typeof pkg.content.imports === "object" && pkg.content.imports !== null
      ? pkg.content.imports
      : {};

  const webSourceSrcPath = join(dirname(entrypoint), "src");
  pkg.update({
    imports: {
      ...existingImports,
      [WEB_SOURCE_IMPORT_ALIAS]: `${normalizePackageJsonPath(
        webSourceSrcPath,
      )}/*`,
    },
  });

  await pkg.save();
}

/** Resolve the generated web-src file extension from the app config file type. */
async function resolveWebSourceExtension(projectRoot: string) {
  const configFilePath = await resolveCommerceAppConfig(projectRoot);
  return configFilePath !== null && isTypeScriptConfig(configFilePath)
    ? "tsx"
    : "jsx";
}

async function writeWebSourceTypeScriptConfig(targetDir: string) {
  const tsconfigPath = join(targetDir, WEB_SOURCE_TSCONFIG_FILE);
  await writeFile(
    tsconfigPath,
    `${JSON.stringify(WEB_SOURCE_TYPESCRIPT_CONFIG, null, 2)}\n`,
    "utf-8",
  );
  return tsconfigPath;
}

/**
 * Resolve the destination path for a web-src template file.
 * @param templatePath - Template file path relative to its source directory.
 * @param extension - Web source extension to generate.
 */
function getWebSourceTemplateTargetPath(
  templatePath: string,
  extension: WebSourceExtension,
) {
  if (extension === "jsx" || !templatePath.endsWith(JSX_FILE_EXTENSION)) {
    return templatePath;
  }

  return `${templatePath.slice(0, -JSX_FILE_EXTENSION.length)}${TSX_FILE_EXTENSION}`;
}

/**
 * Copy web-src templates directly to the final file extension and entrypoint.
 * @param sourceDir - Template web-src directory.
 * @param targetDir - Generated web-src directory.
 * @param extension - Web source extension to generate.
 * @param appTitle - Application title used by the entrypoint template.
 * @param projectRoot - Resolved project root used to format output paths.
 */
async function copyWebSourceTemplates(
  sourceDir: string,
  targetDir: string,
  extension: WebSourceExtension,
  appTitle: string,
  projectRoot: string,
): Promise<string[]> {
  await mkdir(targetDir, { recursive: true });

  const entries = await readdir(sourceDir, { withFileTypes: true });
  const outputFilesByEntry = await Promise.all(
    entries.map(async (entry) => {
      const sourcePath = join(sourceDir, entry.name);
      const targetPath = join(
        targetDir,
        getWebSourceTemplateTargetPath(entry.name, extension),
      );

      if (entry.isDirectory()) {
        return await copyWebSourceTemplates(
          sourcePath,
          targetPath,
          extension,
          appTitle,
          projectRoot,
        );
      }

      let content = await readFile(sourcePath, "utf-8");

      if (extension === "tsx") {
        content = content.replaceAll(
          `${JSX_FILE_EXTENSION}"`,
          `${TSX_FILE_EXTENSION}"`,
        );
      }

      if (targetPath.endsWith(WEB_SOURCE_ENTRYPOINT_FILE)) {
        content = content.replaceAll(APP_TITLE_PLACEHOLDER, appTitle);
      }

      await writeFile(targetPath, content, { encoding: "utf-8", flag: "wx" });
      return ` ${relative(projectRoot, targetPath)}`;
    }),
  );

  return outputFilesByEntry.flat();
}

/**
 * Generates the web source scaffold for an iframe-based Admin UI extension.
 * @param extConfig - Extension config containing the web entrypoint.
 * @param appName - Application name inserted into the generated entrypoint.
 * @param projectRoot - Resolved project root where web source is generated.
 * @param templatesDir - Directory containing web source templates.
 */
export async function generateWebSrc(
  extConfig: ExtConfig,
  appName: string,
  projectRoot: string,
  templatesDir = TEMPLATES_DIR,
) {
  const entrypoint = getWebSourceEntrypoint(extConfig);
  if (entrypoint === null) {
    return;
  }

  const entrypointPath = join(projectRoot, entrypoint);

  if (existsSync(entrypointPath)) {
    consola.info(
      `web-src entrypoint already exists, skipping scaffold: ${relative(
        projectRoot,
        entrypointPath,
      )}`,
    );
    return;
  }

  consola.start(
    `Scaffolding web-src for ${BACKEND_UI_V2_EXTENSION_POINT_ID}...`,
  );

  const sourceDir = join(templatesDir, "admin-ui", "web-src");
  const targetDir = dirname(entrypointPath);
  const extension = await resolveWebSourceExtension(projectRoot);

  const outputFiles = await copyWebSourceTemplates(
    sourceDir,
    targetDir,
    extension,
    appName,
    projectRoot,
  );

  if (extension === "tsx") {
    const tsconfigPath = await writeWebSourceTypeScriptConfig(targetDir);
    outputFiles.push(` ${relative(projectRoot, tsconfigPath)}`);
    await syncWebSourceTypecheckScript(projectRoot);
  }

  await prepareWebSourcePackage(projectRoot, extension);

  consola.success(`Scaffolded ${relative(projectRoot, targetDir)}`);
  consola.log.raw(formatTree(outputFiles));
}
