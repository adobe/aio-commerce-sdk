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

import { beforeEach, describe, expect, it } from "vitest";

import {
  decrypt,
  ENCRYPTED_PREFIX,
  encrypt,
  generateEncryptionKey,
  HEX_PATTERN,
  KEY_LENGTH_HEX,
  validateEncryptionKey,
} from "#utils/encryption";

describe("encryption utilities", () => {
  let encryptionKey: string;

  beforeEach(() => {
    encryptionKey = generateEncryptionKey();
  });

  describe("generateEncryptionKey", () => {
    it("should generate a 64-character hex string", () => {
      const key = generateEncryptionKey();
      expect(key).toHaveLength(KEY_LENGTH_HEX);
      expect(key).toMatch(HEX_PATTERN);
    });

    it("should generate unique keys", () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      expect(key1).not.toBe(key2);
    });

    it("should generate a valid encryption key", () => {
      const key = generateEncryptionKey();
      expect(() => validateEncryptionKey(key)).not.toThrow();
    });
  });

  describe("encrypt and decrypt", () => {
    it("should encrypt and decrypt a password correctly", () => {
      const plainText = "my-secret-password";
      const encrypted = encrypt(plainText, encryptionKey);

      expect(encrypted).not.toBe(plainText);
      expect(encrypted.startsWith(ENCRYPTED_PREFIX)).toBe(true);

      const decrypted = decrypt(encrypted, encryptionKey);
      expect(decrypted).toBe(plainText);
    });

    it("should handle empty strings", () => {
      const plainText = "";
      const encrypted = encrypt(plainText, encryptionKey);
      const decrypted = decrypt(encrypted, encryptionKey);
      expect(decrypted).toBe(plainText);
    });

    it("should handle special characters", () => {
      const plainText = "p@ssw0rd!#$%^&*()_+-=[]{}|;:',.<>?/~`";
      const encrypted = encrypt(plainText, encryptionKey);
      const decrypted = decrypt(encrypted, encryptionKey);
      expect(decrypted).toBe(plainText);
    });

    it("should handle unicode characters", () => {
      const plainText = "密码🔒🔑";
      const encrypted = encrypt(plainText, encryptionKey);
      const decrypted = decrypt(encrypted, encryptionKey);
      expect(decrypted).toBe(plainText);
    });

    it("should return different encrypted values for the same input", () => {
      const plainText = "my-secret-password";
      const encrypted1 = encrypt(plainText, encryptionKey);
      const encrypted2 = encrypt(plainText, encryptionKey);

      expect(encrypted1).not.toBe(encrypted2);

      expect(decrypt(encrypted1, encryptionKey)).toBe(plainText);
      expect(decrypt(encrypted2, encryptionKey)).toBe(plainText);
    });

    it("should throw an error when decrypting non-encrypted values", () => {
      const plainText = "not-encrypted";
      expect(() => decrypt(plainText, encryptionKey)).toThrow();
    });
  });

  describe("decrypt with invalid format", () => {
    it("should handle invalid encrypted format gracefully", () => {
      const invalidEncrypted = "enc:invalid-format";
      expect(() => decrypt(invalidEncrypted, encryptionKey)).toThrow();
    });

    it("should handle malformed encrypted data", () => {
      const malformed = "enc:abc:def:ghi";
      expect(() => decrypt(malformed, encryptionKey)).toThrow();
    });
  });
});
