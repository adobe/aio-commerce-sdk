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

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import adminUiPkg from "@adobe/aio-commerce-lib-admin-ui/package.json" with {
  type: "json",
};
import libConfigPkg from "@adobe/aio-commerce-lib-config/package.json" with {
  type: "json",
};
import { readWantedLockfile } from "@pnpm/lockfile.fs";

import spec from "./docs/openapi.json" with { type: "json" };
import pkg from "./package.json" with { type: "json" };

import type { ResolvedCatalogEntry } from "@pnpm/lockfile.fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Serializes a value as JavaScript code for TSDown/Vitest define replacement.
 * @param value - The string value to inject.
 */
function defineString(value: string) {
  return JSON.stringify(value);
}

/**
 * Ensures the package is in the catalog and returns its specifier.
 * @param packageName - The name of the package to get the specifier for.
 * @param catalogEntries - The catalog entries to search.
 */
function getSpecifier(
  packageName: string,
  catalogEntries: Record<string, ResolvedCatalogEntry>,
) {
  const entry = catalogEntries[packageName];

  if (!entry) {
    throw new Error(
      `Could not find catalog entry for package "${packageName}".`,
    );
  }

  return defineString(entry.specifier);
}

/** Returns the build variables for TSDown */
export async function getVariables() {
  const workspaceRoot = resolve(__dirname, "../..");
  const lockfile = await readWantedLockfile(workspaceRoot, {
    ignoreIncompatible: true,
  });

  if (!lockfile) {
    throw new Error(
      "Could not read pnpm lockfile. It's required to resolve dependency versions.",
    );
  }

  const reactCatalog = lockfile.catalogs?.react;

  if (!reactCatalog) {
    throw new Error(
      "Could not find react catalog in pnpm lockfile. It's required to resolve dependency versions.",
    );
  }

  return {
    __REACT_VERSION__: getSpecifier("react", reactCatalog),
    __REACT_DOM_VERSION__: getSpecifier("react-dom", reactCatalog),
    __REACT_DOM_TYPES_VERSION__: getSpecifier("@types/react-dom", reactCatalog),
    __REACT_TYPES_VERSION__: getSpecifier("@types/react", reactCatalog),
    __SPECTRUM_S2_VERSION__: getSpecifier("@react-spectrum/s2", reactCatalog),

    __LIB_ADMIN_UI_RANGE__: defineString(`^${adminUiPkg.version}`),
    __LIB_CONFIG_RANGE__: defineString(`^${libConfigPkg.version}`),
    __PKG_VERSION__: defineString(pkg.version),
    __OPENAPI_VERSION__: defineString(spec.info.version),
  };
}

declare global {
  var __REACT_VERSION__: string;
  var __REACT_DOM_VERSION__: string;
  var __REACT_DOM_TYPES_VERSION__: string;
  var __REACT_TYPES_VERSION__: string;
  var __SPECTRUM_S2_VERSION__: string;

  var __LIB_ADMIN_UI_RANGE__: string;
  var __LIB_CONFIG_RANGE__: string;
  var __PKG_VERSION__: string;
  var __OPENAPI_VERSION__: string;
}
