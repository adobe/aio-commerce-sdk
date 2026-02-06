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

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { getGlobalLibConfigOptions } from "#config-manager";
import { getLogger } from "#utils/logger";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
export const KEY_LENGTH_BYTES = 32;
export const KEY_LENGTH_HEX = KEY_LENGTH_BYTES * 2;
export const ENCRYPTED_PREFIX = "enc:";
export const HEX_PATTERN = /^[\da-f]+$/i;

const ENCRYPTED_PARTS_COUNT = 3;

/**
 * Generates a new encryption key suitable for AIO_COMMERCE_CONFIG_ENCRYPTION_KEY.
 * @returns A hex string representing a 256-bit encryption key.
 */
export function generateEncryptionKey(): string {
  return randomBytes(KEY_LENGTH_BYTES).toString("hex");
}

/**
 * Checks if encryption is properly configured.
 * @returns True if encryption key is available and valid, false otherwise.
 */
export function isEncryptionConfigured(): boolean {
  return getEncryptionKey() !== null;
}

/**
 * Gets the encryption key from global config.
 * @returns The encryption key as a Buffer, or null if not configured.
 */
function getEncryptionKey(): Buffer | null {
  const logger = getLogger("@adobe/aio-commerce-lib-config:encryption");

  const key = getGlobalLibConfigOptions().encryptionKey;

  if (!key) {
    return null;
  }

  if (!HEX_PATTERN.test(key)) {
    logger.warn(
      "AIO_COMMERCE_CONFIG_ENCRYPTION_KEY is not a valid hex string. Password encryption is disabled.",
    );
    return null;
  }

  const keyBuffer = Buffer.from(key, "hex");
  if (key.length !== KEY_LENGTH_HEX || keyBuffer.length !== KEY_LENGTH_BYTES) {
    logger.warn(
      `AIO_COMMERCE_CONFIG_ENCRYPTION_KEY must be ${KEY_LENGTH_HEX} hex characters (${KEY_LENGTH_BYTES} bytes). Password encryption is disabled.`,
    );
    return null;
  }

  return keyBuffer;
}

/**
 * Encrypts a plain text value using AES-256-GCM encryption.
 * @param plainText - The text to encrypt.
 * @returns The encrypted text with format "enc:IV:AUTH_TAG:ENCRYPTED_DATA".
 * @throws {Error} If encryption key is not configured or encryption fails.
 */
export function encrypt(plainText: string): string {
  const logger = getLogger("@adobe/aio-commerce-lib-config:encryption");

  const key = getEncryptionKey();
  if (!key) {
    const error = new Error(
      "AIO_COMMERCE_CONFIG_ENCRYPTION_KEY is not configured. Cannot encrypt password field. Ensure the encryption key is set in your environment variables.",
    );
    logger.error(error.message);
    throw error;
  }

  try {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    return `${ENCRYPTED_PREFIX}${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to encrypt password:", errorMessage);
    throw new Error(`Failed to encrypt password: ${errorMessage}`);
  }
}

/**
 * Decrypts an encrypted value.
 * @param encryptedText - The encrypted text with format "enc:IV:AUTH_TAG:ENCRYPTED_DATA".
 * @returns The decrypted plain text or the original text if decryption fails.
 */
export function decrypt(encryptedText: string): string {
  const logger = getLogger("@adobe/aio-commerce-lib-config:encryption");

  const key = getEncryptionKey();
  if (!key) {
    const error = new Error(
      "AIO_COMMERCE_CONFIG_ENCRYPTION_KEY is not configured. Cannot encrypt password field. Ensure the encryption key is set in your environment variables.",
    );
    logger.error(error.message);
    throw error;
  }

  try {
    const parts = encryptedText.slice(ENCRYPTED_PREFIX.length).split(":");
    if (parts.length !== ENCRYPTED_PARTS_COUNT) {
      logger.error(
        "Invalid encrypted value format. Expected 'enc:IV:AUTH_TAG:DATA' format.",
      );
      return encryptedText;
    }

    const [ivHex, authTagHex, encryptedData] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    logger.error(
      "Failed to decrypt password:",
      error instanceof Error ? error.message : String(error),
    );
    return encryptedText;
  }
}
