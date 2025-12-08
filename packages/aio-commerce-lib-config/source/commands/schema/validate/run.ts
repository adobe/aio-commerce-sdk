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

import { loadBusinessConfigSchema } from "./lib";

/**
 * Validate the configuration schema.
 * @returns The validated schema.
 */
export async function run() {
  process.stdout.write("\n🔍 Validating configuration schema...\n");

  try {
    const result = await loadBusinessConfigSchema();
    if (result !== null) {
      process.stdout.write("✅ Configuration schema validation passed.\n");
      return result;
    }

    process.stdout.write("⚠️ No schema found to validate.\n");
    return null;
  } catch (error) {
    process.stderr.write(`${stringifyError(error as Error)}\n`);
    process.stderr.write("\n❌ Configuration schema validation failed\n");

    throw new Error("Configuration schema validation failed", { cause: error });
  }
}
