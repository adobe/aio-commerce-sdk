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

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import {
  detectPackageManager,
  findNearestPackageJson,
  getExecCommand,
} from "@aio-commerce-sdk/scripting-utils/project";
import consola from "consola";

import { validateEncryptionKey } from "#utils/encryption";

const ENCRYPTION_KEY_ENV_VAR = "AIO_COMMERCE_CONFIG_ENCRYPTION_KEY";

/** Sets up an encryption key for password field at the given environment file path. */
export async function run(envPath: string) {
  const projectDir = dirname(envPath);
  process.loadEnvFile(envPath);

  const packageExec = getExecCommand(await detectPackageManager(projectDir));

  if (!process.env[ENCRYPTION_KEY_ENV_VAR]) {
    throw new Error(
      [
        `Password fields found in schema, but encryption key is not set in "${envPath}".`,
        `  Run ${packageExec} aio-commerce-lib-config encryption setup to generate an encryption key.`,
      ].join("\n"),
    );
  }

  validateEncryptionKey(process.env[ENCRYPTION_KEY_ENV_VAR]);
  consola.success("Encryption key is valid");
}

/** Run the encryption validate command */
export async function exec() {
  try {
    const dir = dirname((await findNearestPackageJson()) ?? process.cwd());
    const envPath = join(dir, ".env");

    await run(envPath);
  } catch (error) {
    if (error instanceof CommerceSdkValidationError) {
      consola.error(error.display());
    } else {
      consola.error(error);
    }

    process.exit(1);
  }
}
