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

import consola from "consola";
import * as prettier from "prettier";

import { parseCommerceAppConfig } from "#config/index";

/** Format file content using prettier, inferring the parser from the file path. */
export function prettierFormat(content: string, filepath: string) {
  return prettier.format(content, {
    semi: true,
    quoteStyle: "double",
    arrowParens: "always",
    bracketSameLine: true,
    bracketSpacing: true,
    trailingComma: "all",
    tabWidth: 2,
    useTabs: false,
    printWidth: 80,
    filepath,
  });
}

/** Load the app commerce config */
export async function loadAppManifest() {
  // If the config file is invalid or missing, we want to fail early before generating any files
  const appConfig = await parseCommerceAppConfig();
  consola.debug("Loaded app commerce config");

  return appConfig;
}
