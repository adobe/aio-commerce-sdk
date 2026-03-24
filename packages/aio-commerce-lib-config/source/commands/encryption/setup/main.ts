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

import { dirname, join } from "node:path";

import { replaceEnvVar } from "@aio-commerce-sdk/scripting-utils/env";
import { findNearestPackageJson } from "@aio-commerce-sdk/scripting-utils/project";
import consola from "consola";

import { generateEncryptionKey } from "#utils/encryption";

const ENCRYPTION_KEY_ENV_VAR = "AIO_COMMERCE_CONFIG_ENCRYPTION_KEY";

/** Sets up an encryption key for password field at the given environment file path. */
export function run(envPath: string) {
  process.loadEnvFile(envPath);

  if (!process.env[ENCRYPTION_KEY_ENV_VAR]) {
    consola.info("No encryption key found in .env file. Generating new key...");
    replaceEnvVar(envPath, ENCRYPTION_KEY_ENV_VAR, generateEncryptionKey());

    consola.success(`Encryption key generated and added to ${envPath}`);
    return;
  }

  consola.info("Encryption key already configured in .env file");
}

/** Run the encryption setup command */
export async function exec() {
  try {
    const packageJson = await findNearestPackageJson();
    const dir = packageJson ? dirname(packageJson) : process.cwd();
    const envPath = join(dir, ".env");

    run(envPath);
  } catch (error) {
    consola.error(error);
    process.exit(1);
  }
}
