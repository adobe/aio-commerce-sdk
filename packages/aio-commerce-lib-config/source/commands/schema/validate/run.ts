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
import consola from "consola";

import { loadBusinessConfigSchema } from "./lib";

/**
 * Validate the configuration schema.
 * @returns The validated schema.
 */
export async function run() {
  consola.start("Validating configuration schema...");
  try {
    const result = await loadBusinessConfigSchema();
    if (result !== null) {
      consola.success("Configuration schema validation passed.");
      return result;
    }

    consola.warn("No schema found to validate.");
    return null;
  } catch (error) {
    consola.error(stringifyError(error));
    process.exit(1);
  }
}
