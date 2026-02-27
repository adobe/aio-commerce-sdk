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
 * Validates the encryption key.
 * @param key - The encryption key to validate.
 *
 * @throws {Error} If the encryption key is not a valid hex string or is not the correct length.
 */
export function validateEncryptionKey(key: string): void {
  if (!HEX_PATTERN.test(key)) {
    throw new Error("The given encryption key is not a valid hex string.");
  }

  const keyBuffer = Buffer.from(key, "hex");

  if (key.length !== KEY_LENGTH_HEX || keyBuffer.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      `The given encryption key must be ${KEY_LENGTH_HEX} hex characters (${KEY_LENGTH_BYTES} bytes).`,
    );
  }
}

/**
 * Encrypts a plain text value using AES-256-GCM encryption.
 *
 * @param plainText - The text to encrypt.
 * @param encryptionKey - The encryption key to use for encryption.
 * @returns The encrypted text.
 *
 * @throws {Error} If encryption key is not configured or encryption fails.
 */
export function encrypt(plainText: string, encryptionKey: string): string {
  validateEncryptionKey(encryptionKey);
  try {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(
      ALGORITHM,
      Buffer.from(encryptionKey, "hex"),
      iv,
    );

    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");
    return `${ENCRYPTED_PREFIX}${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    throw new Error("Failed to encrypt password", {
      cause: error,
    });
  }
}

/**
 * Decrypts an encrypted value.
 *
 * @param encryptedText - The encrypted text with format "enc:IV:AUTH_TAG:ENCRYPTED_DATA".
 * @param encryptionKey - The encryption key to use for decryption.
 * @returns The decrypted plain text.
 *
 * @throws {Error} If decryption fails.
 */
export function decrypt(encryptedText: string, encryptionKey: string): string {
  validateEncryptionKey(encryptionKey);
  try {
    const parts = encryptedText.slice(ENCRYPTED_PREFIX.length).split(":");
    if (parts.length !== ENCRYPTED_PARTS_COUNT) {
      throw new Error(
        "Invalid encrypted value format. Expected 'enc:IV:AUTH_TAG:DATA' format.",
      );
    }

    const [ivHex, authTagHex, encryptedData] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = createDecipheriv(
      ALGORITHM,
      Buffer.from(encryptionKey, "hex"),
      iv,
    );

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error("Failed to decrypt password", {
      cause: error,
    });
  }
}
