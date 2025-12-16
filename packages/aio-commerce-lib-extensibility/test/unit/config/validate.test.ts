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

import { describe, expect, test } from "vitest";

import { validateConfig, validateConfigDomain } from "#config/lib/validate";

const MAX_DISPLAY_NAME_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 255;

describe("validateConfig", () => {
  test("should validate a complete valid config", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      businessConfig: {
        schema: [
          {
            name: "apiKey",
            type: "text",
            label: "API Key",
            description: "Your API key",
          },
          {
            name: "environment",
            type: "list",
            label: "Environment",
            selectionMode: "single",
            options: [
              { label: "Production", value: "prod" },
              { label: "Sandbox", value: "sandbox" },
            ],
            default: "sandbox",
          },
        ],
      },
    };

    expect(() => validateConfig(config)).not.toThrow();
    const validated = validateConfig(config);
    expect(validated.metadata.id).toBe("test-app");
    expect(validated.businessConfig?.schema).toHaveLength(2);
  });

  test("should validate config with only required metadata", () => {
    const config = {
      metadata: {
        id: "minimal-app",
        displayName: "Minimal App",
        description: "A minimal application",
        version: "1.0.0",
      },
    };

    expect(() => validateConfig(config)).not.toThrow();
    const validated = validateConfig(config);
    expect(validated.metadata.id).toBe("minimal-app");
    expect(validated.businessConfig).toBeUndefined();
  });

  test("should throw CommerceSdkValidationError when metadata is missing", () => {
    const config = {
      businessConfig: {
        schema: [],
      },
    };

    expect(() => validateConfig(config)).toThrow(
      "Invalid extensibility config",
    );
  });

  test("should throw CommerceSdkValidationError when metadata.id is missing", () => {
    const config = {
      metadata: {
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
    };

    expect(() => validateConfig(config)).toThrow(
      "Invalid extensibility config",
    );
  });

  test("should throw CommerceSdkValidationError when metadata.id contains invalid characters", () => {
    const config = {
      metadata: {
        id: "test app!", // Invalid: contains space and special char
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
    };

    expect(() => validateConfig(config)).toThrow(
      "Invalid extensibility config",
    );
  });

  test("should accept metadata.id with alphanumeric and dashes", () => {
    const config = {
      metadata: {
        id: "test-app-123",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
    };

    expect(() => validateConfig(config)).not.toThrow();
  });

  test("should throw when displayName exceeds 50 characters", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "A".repeat(MAX_DISPLAY_NAME_LENGTH + 1),
        description: "A test application",
        version: "1.0.0",
      },
    };

    expect(() => validateConfig(config)).toThrow(
      "Invalid extensibility config",
    );
  });

  test("should accept displayName with exactly 50 characters", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "A".repeat(MAX_DISPLAY_NAME_LENGTH),
        description: "A test application",
        version: "1.0.0",
      },
    };

    expect(() => validateConfig(config)).not.toThrow();
  });

  test("should throw when description exceeds 255 characters", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A".repeat(MAX_DESCRIPTION_LENGTH + 1),
        version: "1.0.0",
      },
    };

    expect(() => validateConfig(config)).toThrow(
      "Invalid extensibility config",
    );
  });

  test("should accept description with exactly 255 characters", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A".repeat(MAX_DESCRIPTION_LENGTH),
        version: "1.0.0",
      },
    };

    expect(() => validateConfig(config)).not.toThrow();
  });

  test.each([
    { version: "1.0", reason: "Missing patch" },
    { version: "1", reason: "Missing minor and patch" },
    { version: "v1.0.0", reason: "Has 'v' prefix" },
    { version: "1.0.0-beta", reason: "Has prerelease" },
    { version: "1.0.0+build", reason: "Has build metadata" },
    { version: "1.0.0-beta+build", reason: "Has both prerelease and build" },
    { version: "invalid", reason: "Not a version at all" },
  ])(
    "should throw when version is not in semver format: $reason",
    ({ version }) => {
      const config = {
        metadata: {
          id: "test-app",
          displayName: "Test App",
          description: "A test application",
          version,
        },
      };

      expect(() => validateConfig(config)).toThrow(
        "Invalid extensibility config",
      );
    },
  );

  test.each([
    { version: "1.0.0" },
    { version: "0.0.1" },
    { version: "10.20.30" },
    { version: "999.999.999" },
  ])("should accept valid semver version: $version", ({ version }) => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version,
      },
    };

    expect(() => validateConfig(config)).not.toThrow();
  });

  test("should throw when businessConfig.schema is empty array", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      businessConfig: {
        schema: [], // Empty array - invalid
      },
    };

    expect(() => validateConfig(config)).toThrow(
      "Invalid extensibility config",
    );
  });

  test("should validate text field type", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      businessConfig: {
        schema: [
          {
            name: "apiKey",
            type: "text",
            label: "API Key",
            description: "Your API key",
            default: "default-key",
          },
        ],
      },
    };

    expect(() => validateConfig(config)).not.toThrow();
  });

  test("should validate email field type", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      businessConfig: {
        schema: [
          {
            name: "contactEmail",
            type: "email",
            label: "Contact Email",
            default: "test@example.com",
          },
        ],
      },
    };

    expect(() => validateConfig(config)).not.toThrow();
  });

  test("should throw when email field has invalid default email", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      businessConfig: {
        schema: [
          {
            name: "contactEmail",
            type: "email",
            label: "Contact Email",
            default: "not-an-email", // Invalid email
          },
        ],
      },
    };

    expect(() => validateConfig(config)).toThrow(
      "Invalid extensibility config",
    );
  });

  test("should validate url field type", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      businessConfig: {
        schema: [
          {
            name: "webhookUrl",
            type: "url",
            label: "Webhook URL",
            default: "https://example.com/webhook",
          },
        ],
      },
    };

    expect(() => validateConfig(config)).not.toThrow();
  });

  test("should validate tel field type", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      businessConfig: {
        schema: [
          {
            name: "supportPhone",
            type: "tel",
            label: "Support Phone",
            default: "+1-555-123-4567",
          },
        ],
      },
    };

    expect(() => validateConfig(config)).not.toThrow();
  });

  test("should validate list field with single selection", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      businessConfig: {
        schema: [
          {
            name: "environment",
            type: "list",
            label: "Environment",
            selectionMode: "single",
            options: [
              { label: "Production", value: "prod" },
              { label: "Sandbox", value: "sandbox" },
            ],
            default: "sandbox",
          },
        ],
      },
    };

    expect(() => validateConfig(config)).not.toThrow();
  });

  test("should validate list field with multiple selection", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      businessConfig: {
        schema: [
          {
            name: "features",
            type: "list",
            label: "Enabled Features",
            selectionMode: "multiple",
            options: [
              { label: "Feature A", value: "feature_a" },
              { label: "Feature B", value: "feature_b" },
            ],
            default: ["feature_a"],
          },
        ],
      },
    };

    expect(() => validateConfig(config)).not.toThrow();
  });

  test("should throw when list field with single selection has array default", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      businessConfig: {
        schema: [
          {
            name: "environment",
            type: "list",
            label: "Environment",
            selectionMode: "single",
            options: [
              { label: "Production", value: "prod" },
              { label: "Sandbox", value: "sandbox" },
            ],
            default: ["sandbox"], // Should be string, not array
          },
        ],
      },
    };

    expect(() => validateConfig(config)).toThrow(
      "Invalid extensibility config",
    );
  });

  test("should throw when list field with multiple selection has string default", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      businessConfig: {
        schema: [
          {
            name: "features",
            type: "list",
            label: "Enabled Features",
            selectionMode: "multiple",
            options: [
              { label: "Feature A", value: "feature_a" },
              { label: "Feature B", value: "feature_b" },
            ],
            default: "feature_a", // Should be array, not string
          },
        ],
      },
    };

    expect(() => validateConfig(config)).toThrow(
      "Invalid extensibility config",
    );
  });

  test("should throw when schema field is missing required name", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      businessConfig: {
        schema: [
          {
            type: "text",
            label: "Some Field",
            // Missing 'name'
          },
        ],
      },
    };

    expect(() => validateConfig(config)).toThrow(
      "Invalid extensibility config",
    );
  });

  test("should throw when schema field is missing required type", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      businessConfig: {
        schema: [
          {
            name: "someField",
            label: "Some Field",
            // Missing 'type'
          },
        ],
      },
    };

    expect(() => validateConfig(config)).toThrow(
      "Invalid extensibility config",
    );
  });

  test("should accept schema field without optional label", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      businessConfig: {
        schema: [
          {
            name: "someField",
            type: "text",
            // label is optional
          },
        ],
      },
    };

    expect(() => validateConfig(config)).not.toThrow();
  });
});

describe("validateConfigDomain", () => {
  test("should validate metadata domain", () => {
    const metadata = {
      id: "test-app",
      displayName: "Test App",
      description: "A test application",
      version: "1.0.0",
    };

    expect(() => validateConfigDomain(metadata, "metadata")).not.toThrow();
    const validated = validateConfigDomain(metadata, "metadata");
    expect(validated.id).toBe("test-app");
  });

  test("should throw when validating invalid metadata domain", () => {
    const metadata = {
      id: "test app!", // Invalid characters
      displayName: "Test App",
      description: "A test application",
      version: "1.0.0",
    };

    expect(() => validateConfigDomain(metadata, "metadata")).toThrow(
      "Invalid extensibility config: metadata",
    );
  });

  test("should validate businessConfig domain", () => {
    const businessConfig = {
      schema: [
        {
          name: "apiKey",
          type: "text",
        },
      ],
    };

    expect(() =>
      validateConfigDomain(businessConfig, "businessConfig"),
    ).not.toThrow();
    const validated = validateConfigDomain(businessConfig, "businessConfig");
    expect(validated.schema).toHaveLength(1);
  });

  test("should throw when validating invalid businessConfig domain", () => {
    const businessConfig = {
      schema: [], // Empty array is invalid
    };

    expect(() =>
      validateConfigDomain(businessConfig, "businessConfig"),
    ).toThrow("Invalid extensibility config: businessConfig");
  });

  test("should validate businessConfig.schema domain", () => {
    const schema = [
      {
        name: "apiKey",
        type: "text",
      },
      {
        name: "environment",
        type: "list",
        label: "Environment",
        selectionMode: "single",
        options: [
          { label: "Production", value: "prod" },
          { label: "Sandbox", value: "sandbox" },
        ],
        default: "sandbox",
      },
    ];

    expect(() =>
      validateConfigDomain(schema, "businessConfig.schema"),
    ).not.toThrow();
    const validated = validateConfigDomain(schema, "businessConfig.schema");
    expect(validated).toHaveLength(2);
  });

  test("should throw when validating invalid businessConfig.schema domain", () => {
    const schema = [
      {
        name: "apiKey",
        // Missing type
      },
    ];

    expect(() => validateConfigDomain(schema, "businessConfig.schema")).toThrow(
      "Invalid extensibility config: businessConfig.schema",
    );
  });

  test("should throw when validating unknown domain", () => {
    const data = { some: "data" };

    expect(() =>
      // @ts-expect-error - Testing invalid domain
      validateConfigDomain(data, "unknownDomain"),
    ).toThrow();
  });
});
