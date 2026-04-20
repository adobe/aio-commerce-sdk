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

import { execSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { touch } from "@aio-commerce-sdk/scripting-utils/filesystem";
import {
  detectPackageManager,
  getExecCommand,
  getProjectRootDirectory,
  makeOutputDirFor,
} from "@aio-commerce-sdk/scripting-utils/project";
import { consola } from "consola";
import { stringify } from "safe-stable-stringify";

import {
  CONFIG_SCHEMA_FILE_NAME,
  CONFIGURATION_EXTENSION_POINT_ID,
} from "#commands/constants";
import { getGeneratedDir, loadAppManifest } from "#commands/utils";
import { hasBusinessConfigSchema } from "#config/index";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

export async function run(appConfig: CommerceAppConfigOutputModel) {
  consola.info("Generating configuration schema...");

  if (!hasBusinessConfigSchema(appConfig)) {
    consola.warn("Business configuration schema not found");
    return;
  }

  const projectDir = await getProjectRootDirectory();
  const envPath = join(projectDir, ".env");

  // Ensure .env file exists to avoid failing when loading it.
  await touch(envPath);
  process.loadEnvFile(envPath);

  const hasPasswordFields = appConfig.businessConfig.schema.some(
    (field) => field.type === "password",
  );

  if (hasPasswordFields) {
    const packageExec = getExecCommand(await detectPackageManager(projectDir));
    const hasEncryptionKey =
      "AIO_COMMERCE_CONFIG_ENCRYPTION_KEY" in process.env &&
      String(process.env.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY).trim().length > 0;

    if (hasEncryptionKey) {
      execSync(`${packageExec} aio-commerce-lib-config encryption validate`);
    } else {
      execSync(`${packageExec} aio-commerce-lib-config encryption setup`);
    }
  }

  const contents = stringify(appConfig.businessConfig.schema, null, 2);
  const outputDir = await makeOutputDirFor(
    getGeneratedDir(CONFIGURATION_EXTENSION_POINT_ID),
  );

  const manifestPath = join(outputDir, CONFIG_SCHEMA_FILE_NAME);
  await writeFile(manifestPath, contents, "utf-8");

  consola.success(`Generated ${CONFIG_SCHEMA_FILE_NAME}`);
}

/** Run the generate schema command */
export async function exec() {
  try {
    const config = await loadAppManifest();
    await run(config);
  } catch (error) {
    if (error instanceof CommerceSdkValidationError) {
      consola.error(error.display());
    } else {
      consola.error(error);
    }
    process.exit(1);
  }
}
