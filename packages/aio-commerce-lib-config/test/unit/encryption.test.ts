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

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  decrypt,
  ENCRYPTED_PREFIX,
  encrypt,
  generateEncryptionKey,
  HEX_PATTERN,
  isEncryptionConfigured,
  KEY_LENGTH_HEX,
} from "#utils/encryption";

describe("encryption utilities", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.CONFIG_ENCRYPTION_KEY;
  });

  afterEach(() => {
    if (originalEnv) {
      process.env.CONFIG_ENCRYPTION_KEY = originalEnv;
    } else {
      process.env.CONFIG_ENCRYPTION_KEY = undefined;
    }
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
  });

  describe("isEncryptionConfigured", () => {
    it("should return false when CONFIG_ENCRYPTION_KEY is not set", () => {
      process.env.CONFIG_ENCRYPTION_KEY = undefined;
      expect(isEncryptionConfigured()).toBe(false);
    });

    it("should return false when CONFIG_ENCRYPTION_KEY is invalid", () => {
      process.env.CONFIG_ENCRYPTION_KEY = "invalid-key";
      expect(isEncryptionConfigured()).toBe(false);
    });

    it("should return true when CONFIG_ENCRYPTION_KEY is valid", () => {
      process.env.CONFIG_ENCRYPTION_KEY = generateEncryptionKey();
      expect(isEncryptionConfigured()).toBe(true);
    });
  });

  describe("encrypt and decrypt", () => {
    beforeEach(() => {
      process.env.CONFIG_ENCRYPTION_KEY = generateEncryptionKey();
    });

    it("should encrypt and decrypt a password correctly", () => {
      const plainText = "my-secret-password";
      const encrypted = encrypt(plainText);

      expect(encrypted).not.toBe(plainText);
      expect(encrypted.startsWith(ENCRYPTED_PREFIX)).toBe(true);

      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plainText);
    });

    it("should handle empty strings", () => {
      const plainText = "";
      const encrypted = encrypt(plainText);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plainText);
    });

    it("should handle special characters", () => {
      const plainText = "p@ssw0rd!#$%^&*()_+-=[]{}|;:',.<>?/~`";
      const encrypted = encrypt(plainText);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plainText);
    });

    it("should handle unicode characters", () => {
      const plainText = "密码🔒🔑";
      const encrypted = encrypt(plainText);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plainText);
    });

    it("should return different encrypted values for the same input", () => {
      const plainText = "my-secret-password";
      const encrypted1 = encrypt(plainText);
      const encrypted2 = encrypt(plainText);

      expect(encrypted1).not.toBe(encrypted2);

      expect(decrypt(encrypted1)).toBe(plainText);
      expect(decrypt(encrypted2)).toBe(plainText);
    });

    it("should return plain text when decrypting non-encrypted values", () => {
      const plainText = "not-encrypted";
      const decrypted = decrypt(plainText);
      expect(decrypted).toBe(plainText);
    });
  });

  describe("encrypt without encryption key", () => {
    beforeEach(() => {
      process.env.CONFIG_ENCRYPTION_KEY = undefined;
    });

    it("should throw an error when encryption key is not configured", () => {
      const plainText = "my-secret-password";
      expect(() => encrypt(plainText)).toThrow(
        "CONFIG_ENCRYPTION_KEY is not configured",
      );
    });

    it("should return encrypted value when decryption key is not configured", () => {
      process.env.CONFIG_ENCRYPTION_KEY = generateEncryptionKey();
      const plainText = "my-secret-password";
      const encrypted = encrypt(plainText);

      process.env.CONFIG_ENCRYPTION_KEY = undefined;
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(encrypted);
    });
  });

  describe("decrypt with wrong key", () => {
    it("should handle decryption with wrong key gracefully", () => {
      process.env.CONFIG_ENCRYPTION_KEY = generateEncryptionKey();
      const plainText = "my-secret-password";
      const encrypted = encrypt(plainText);

      process.env.CONFIG_ENCRYPTION_KEY = generateEncryptionKey();
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(encrypted);
    });
  });

  describe("decrypt with invalid format", () => {
    beforeEach(() => {
      process.env.CONFIG_ENCRYPTION_KEY = generateEncryptionKey();
    });

    it("should handle invalid encrypted format gracefully", () => {
      const invalidEncrypted = "enc:invalid-format";
      const decrypted = decrypt(invalidEncrypted);
      expect(decrypted).toBe(invalidEncrypted);
    });

    it("should handle malformed encrypted data", () => {
      const malformed = "enc:abc:def:ghi";
      const decrypted = decrypt(malformed);
      expect(decrypted).toBe(malformed);
    });
  });
});
