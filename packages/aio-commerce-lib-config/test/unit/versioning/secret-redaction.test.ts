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

import { describe, expect, it } from "vitest";

import {
  isSensitiveField,
  REDACTED_VALUE,
  redactSensitiveConfig,
  redactSensitiveDiffs,
} from "#modules/versioning/secret-redaction";

import type { ConfigValue } from "#modules/configuration/types";
import type { ConfigDiff } from "#modules/versioning/types";

// Helper to cast values to ConfigValue type
const asConfigValue = (value: unknown) => value as ConfigValue["value"];

describe("Secret Redaction", () => {
  describe("isSensitiveField", () => {
    it("should identify password fields as sensitive", () => {
      expect(isSensitiveField("user_password")).toBe(true);
      expect(isSensitiveField("PASSWORD")).toBe(true);
      expect(isSensitiveField("admin_password_hash")).toBe(true);
    });

    it("should identify secret fields as sensitive", () => {
      expect(isSensitiveField("api_secret")).toBe(true);
      expect(isSensitiveField("client_secret")).toBe(true);
      expect(isSensitiveField("SECRET_KEY")).toBe(true);
    });

    it("should identify API key fields as sensitive", () => {
      expect(isSensitiveField("api_key")).toBe(true);
      expect(isSensitiveField("apiKey")).toBe(true);
      expect(isSensitiveField("stripe_api-key")).toBe(true);
    });

    it("should identify token fields as sensitive", () => {
      expect(isSensitiveField("access_token")).toBe(true);
      expect(isSensitiveField("auth_token")).toBe(true);
      expect(isSensitiveField("bearer_token")).toBe(true);
    });

    it("should identify private key fields as sensitive", () => {
      expect(isSensitiveField("private_key")).toBe(true);
      expect(isSensitiveField("rsa_private_key")).toBe(true);
    });

    it("should identify credential fields as sensitive", () => {
      expect(isSensitiveField("database_credentials")).toBe(true);
      expect(isSensitiveField("user_credential")).toBe(true);
    });

    it("should not identify non-sensitive fields", () => {
      expect(isSensitiveField("user_email")).toBe(false);
      expect(isSensitiveField("site_name")).toBe(false);
      expect(isSensitiveField("enable_feature")).toBe(false);
      expect(isSensitiveField("timeout")).toBe(false);
    });
  });

  describe("redactSensitiveConfig", () => {
    it("should redact sensitive values in configuration", () => {
      const config: ConfigValue[] = [
        {
          name: "api_key",
          value: "secret-key-123",
          origin: { code: "global", level: "global" },
        },
        {
          name: "site_name",
          value: "My Store",
          origin: { code: "global", level: "global" },
        },
        {
          name: "admin_password",
          value: "super-secret",
          origin: { code: "global", level: "global" },
        },
      ];

      const redacted = redactSensitiveConfig(config);

      expect(redacted[0].value).toBe(REDACTED_VALUE);
      expect(redacted[1].value).toBe("My Store");
      expect(redacted[2].value).toBe(REDACTED_VALUE);
    });

    it("should handle empty configuration", () => {
      const redacted = redactSensitiveConfig([]);
      expect(redacted).toEqual([]);
    });

    it("should not modify non-sensitive configuration", () => {
      const config: ConfigValue[] = [
        {
          name: "timeout",
          value: asConfigValue(5000),
          origin: { code: "global", level: "global" },
        },
        {
          name: "enable_cache",
          value: asConfigValue(true),
          origin: { code: "global", level: "global" },
        },
      ];

      const redacted = redactSensitiveConfig(config);

      expect(redacted[0].value).toBe(5000);
      expect(redacted[1].value).toBe(true);
    });
  });

  describe("redactSensitiveDiffs", () => {
    it("should redact sensitive values in diffs", () => {
      const diffs: ConfigDiff[] = [
        {
          name: "api_key",
          oldValue: "old-key",
          newValue: "new-key",
          type: "modified",
        },
        {
          name: "timeout",
          oldValue: 1000,
          newValue: 5000,
          type: "modified",
        },
        {
          name: "password",
          newValue: "new-password",
          type: "added",
        },
      ];

      const redacted = redactSensitiveDiffs(diffs);

      expect(redacted[0].oldValue).toBe(REDACTED_VALUE);
      expect(redacted[0].newValue).toBe(REDACTED_VALUE);
      expect(redacted[1].oldValue).toBe(1000);
      expect(redacted[1].newValue).toBe(5000);
      expect(redacted[2].newValue).toBe(REDACTED_VALUE);
      expect(redacted[2].oldValue).toBeUndefined();
    });

    it("should handle removed sensitive fields", () => {
      const diffs: ConfigDiff[] = [
        {
          name: "secret_key",
          oldValue: "secret-123",
          type: "removed",
        },
      ];

      const redacted = redactSensitiveDiffs(diffs);

      expect(redacted[0].oldValue).toBe(REDACTED_VALUE);
      expect(redacted[0].newValue).toBeUndefined();
    });

    it("should preserve diff types", () => {
      const diffs: ConfigDiff[] = [
        {
          name: "api_secret",
          newValue: "new-secret",
          type: "added",
        },
        {
          name: "client_secret",
          oldValue: "old-secret",
          newValue: "new-secret",
          type: "modified",
        },
        {
          name: "temp_secret",
          oldValue: "temp",
          type: "removed",
        },
      ];

      const redacted = redactSensitiveDiffs(diffs);

      expect(redacted[0].type).toBe("added");
      expect(redacted[1].type).toBe("modified");
      expect(redacted[2].type).toBe("removed");
    });
  });
});
