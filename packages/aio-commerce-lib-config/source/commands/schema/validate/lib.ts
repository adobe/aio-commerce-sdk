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

import { existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  readExtensibilityConfig,
  validateConfigDomain,
} from "@adobe/aio-commerce-lib-extensibility/config";
import { getProjectRootDirectory } from "@aio-commerce-sdk/scripting-utils/project";

import { EXTENSIBILITY_CONFIG_FILE } from "#commands/constants";

/** Load the business configuration schema from the given path. */
export async function loadBusinessConfigSchema() {
  let resolvedPath: string | null = null;
  try {
    resolvedPath = resolve(
      await getProjectRootDirectory(),
      EXTENSIBILITY_CONFIG_FILE,
    );
  } finally {
    if (!(resolvedPath && existsSync(resolvedPath))) {
      // biome-ignore lint/correctness/noUnsafeFinally: Safe to return null
      return null;
    }
  }

  const extensibilityConfig = await readExtensibilityConfig();
  const schema = extensibilityConfig?.businessConfig?.schema ?? null;

  if (!schema) {
    return null;
  }

  return validateConfigDomain(schema, "businessConfig.schema");
}
