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
import { appendFile, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";
import { getProjectRootDirectory } from "@aio-commerce-sdk/scripting-utils/project";
import consola from "consola";

import {
  generateEncryptionKey,
  isEncryptionConfigured,
} from "#utils/encryption";

import { loadBusinessConfigSchema } from "./lib";

import type { BusinessConfigSchemaField } from "#modules/schema/types";

const CONFIG_KEY_PATTERN = /AIO_COMMERCE_CONFIG_ENCRYPTION_KEY=(.+)/;

/**
 * Validate the configuration schema.
 * @returns The validated schema.
 */
export async function run() {
  consola.start("Validating configuration schema...");
  try {
    const result = await loadBusinessConfigSchema();
    if (result !== null) {
      const hasPasswordFields = result.some(
        (field: BusinessConfigSchemaField) => field.type === "password",
      );

      if (hasPasswordFields) {
        await loadEnvFile();

        if (!isEncryptionConfigured()) {
          const setupSuccess = await setupEncryptionKey();
          if (!setupSuccess) {
            consola.error(
              "Schema validation failed: encryption key could not be configured",
            );
            process.exit(1);
          }
        }
      }

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

/**
 * Loads AIO_COMMERCE_CONFIG_ENCRYPTION_KEY from .env file into process.env if it exists.
 */
async function loadEnvFile(): Promise<void> {
  try {
    const { envContent } = await getEnvFile();
    if (envContent) {
      const keyMatch = envContent.match(CONFIG_KEY_PATTERN);
      if (keyMatch?.[1]) {
        process.env.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY = keyMatch[1].trim();
      }
    }
  } catch (_error) {
    // Ignore errors, encryption check will handle missing key
  }
}

/**
 * Gets the .env file path and optionally reads its content.
 * @returns Object with envPath and optional envContent
 */
async function getEnvFile(): Promise<{ envPath: string; envContent?: string }> {
  const rootDir = await getProjectRootDirectory();
  const envPath = resolve(rootDir, ".env");

  if (existsSync(envPath)) {
    const envContent = await readFile(envPath, "utf-8");
    return { envPath, envContent };
  }

  return { envPath };
}

/**
 * Sets up encryption key by generating one and adding it to .env file.
 * Only creates .env if running in development environment.
 * @returns True if setup succeeded, false otherwise.
 */
async function setupEncryptionKey(): Promise<boolean> {
  try {
    const { envPath, envContent } = await getEnvFile();
    const key = generateEncryptionKey();

    if (envContent) {
      if (envContent.includes("AIO_COMMERCE_CONFIG_ENCRYPTION_KEY=")) {
        consola.warn(
          "⚠️  AIO_COMMERCE_CONFIG_ENCRYPTION_KEY found in .env but is invalid (wrong format or length)",
        );

        if (process.stdin.isTTY && process.stdout.isTTY) {
          consola.warn(
            "⚠️  Regenerating the key will make any previously encrypted passwords unrecoverable",
          );

          const confirmed = await consola.prompt(
            "Do you want to generate a new encryption key?",
            {
              type: "confirm",
              initial: false,
            },
          );

          if (!confirmed) {
            consola.info(
              "Key regeneration cancelled. Please manually fix AIO_COMMERCE_CONFIG_ENCRYPTION_KEY in your .env file.",
            );
            return false;
          }
        } else {
          consola.info("Automatically regenerating encryption key.");
        }

        const updatedContent = envContent.replace(
          CONFIG_KEY_PATTERN,
          `AIO_COMMERCE_CONFIG_ENCRYPTION_KEY=${key}`,
        );
        await writeFile(envPath, updatedContent, "utf-8");

        consola.success(
          "🔐 Generated new encryption key and updated .env file",
        );
        consola.warn(
          "⚠️  Any previously encrypted passwords with the old key cannot be decrypted",
        );
        return true;
      }

      const keyLine = `\n# Auto-generated encryption key for password fields\nAIO_COMMERCE_CONFIG_ENCRYPTION_KEY=${key}\n`;
      await appendFile(envPath, keyLine, "utf-8");
      process.env.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY = key;

      consola.success("🔐 Generated encryption key and added to .env file");
      return true;
    }

    consola.error(
      "⚠️  AIO_COMMERCE_CONFIG_ENCRYPTION_KEY not found and .env file doesn't exist",
    );
    consola.info("Generate a key with:");
    consola.info(
      "  import { generateEncryptionKey } from '@adobe/aio-commerce-lib-config';",
    );
    consola.info("  console.log(generateEncryptionKey());");
    return false;
  } catch (error) {
    consola.error("Failed to setup encryption key:", stringifyError(error));
    return false;
  }
}
