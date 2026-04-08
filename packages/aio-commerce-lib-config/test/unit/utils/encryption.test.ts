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

import { beforeEach, describe, expect, test } from "vitest";

import {
  decrypt,
  ENCRYPTED_PREFIX,
  encrypt,
  generateEncryptionKey,
  HEX_PATTERN,
  KEY_LENGTH_HEX,
  validateEncryptionKey,
} from "#utils/encryption";

describe("utils/encryption", () => {
  let encryptionKey: string;

  beforeEach(() => {
    encryptionKey = generateEncryptionKey();
  });

  describe("generateEncryptionKey", () => {
    test("should generate a 64-character hex string", () => {
      const key = generateEncryptionKey();
      expect(key).toHaveLength(KEY_LENGTH_HEX);
      expect(key).toMatch(HEX_PATTERN);
    });

    test("should generate unique keys", () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      expect(key1).not.toBe(key2);
    });

    test("should generate a valid encryption key", () => {
      const key = generateEncryptionKey();
      expect(() => validateEncryptionKey(key)).not.toThrow();
    });

    test("should throw when key is valid hex but wrong length", () => {
      const shortKey = "deadbeef".repeat(4); // 32 hex chars, needs 64
      expect(() => validateEncryptionKey(shortKey)).toThrow();
    });
  });

  describe("encrypt and decrypt", () => {
    test("should encrypt and decrypt a password correctly", () => {
      const plainText = "my-secret-password";
      const encrypted = encrypt(plainText, encryptionKey);

      expect(encrypted).not.toBe(plainText);
      expect(encrypted.startsWith(ENCRYPTED_PREFIX)).toBe(true);

      const decrypted = decrypt(encrypted, encryptionKey);
      expect(decrypted).toBe(plainText);
    });

    test("should handle empty strings", () => {
      const plainText = "";
      const encrypted = encrypt(plainText, encryptionKey);
      const decrypted = decrypt(encrypted, encryptionKey);
      expect(decrypted).toBe(plainText);
    });

    test("should handle special characters", () => {
      const plainText = "p@ssw0rd!#$%^&*()_+-=[]{}|;:',.<>?/~`";
      const encrypted = encrypt(plainText, encryptionKey);
      const decrypted = decrypt(encrypted, encryptionKey);
      expect(decrypted).toBe(plainText);
    });

    test("should handle unicode characters", () => {
      const plainText = "密码🔒🔑";
      const encrypted = encrypt(plainText, encryptionKey);
      const decrypted = decrypt(encrypted, encryptionKey);
      expect(decrypted).toBe(plainText);
    });

    test("should return different encrypted values for the same input", () => {
      const plainText = "my-secret-password";
      const encrypted1 = encrypt(plainText, encryptionKey);
      const encrypted2 = encrypt(plainText, encryptionKey);

      expect(encrypted1).not.toBe(encrypted2);

      expect(decrypt(encrypted1, encryptionKey)).toBe(plainText);
      expect(decrypt(encrypted2, encryptionKey)).toBe(plainText);
    });

    test("should throw an error when decrypting non-encrypted values", () => {
      const plainText = "not-encrypted";
      expect(() => decrypt(plainText, encryptionKey)).toThrow();
    });
  });

  describe("decrypt with invalid format", () => {
    test("should throw when value does not start with encrypted prefix", () => {
      const invalidEncrypted = "not-encrypted";
      expect(() => decrypt(invalidEncrypted, encryptionKey)).toThrow(
        "Invalid encrypted value. Expected value to start with 'enc:'.",
      );
    });

    test("should throw when value is empty", () => {
      expect(() => decrypt("", encryptionKey)).toThrow(
        "Invalid encrypted value. Expected value to start with 'enc:'.",
      );
    });

    test("should handle invalid encrypted format gracefully", () => {
      const invalidEncrypted = "enc:invalid-format";
      expect(() => decrypt(invalidEncrypted, encryptionKey)).toThrow();
    });

    test("should handle malformed encrypted data", () => {
      const malformed = "enc:abc:def:ghi";
      expect(() => decrypt(malformed, encryptionKey)).toThrow();
    });
  });
});
