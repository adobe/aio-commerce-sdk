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

import {
  validateCommerceAppConfig,
  validateCommerceAppConfigDomain,
} from "#config/lib/validate";
import {
  configWithCustomInstallationSteps,
  createCommerceEventConfig,
  minimalValidConfig,
} from "#test/fixtures/config";

const MAX_ID_LENGTH = 100;
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

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
    const validated = validateCommerceAppConfig(config);
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

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
    const validated = validateCommerceAppConfig(config);
    expect(validated.metadata.id).toBe("minimal-app");
    expect(validated.businessConfig).toBeUndefined();
  });

  test("should throw CommerceSdkValidationError when metadata is missing", () => {
    const config = {
      businessConfig: {
        schema: [],
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow(
      "Invalid commerce app config",
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

    expect(() => validateCommerceAppConfig(config)).toThrow(
      "Invalid commerce app config",
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

    expect(() => validateCommerceAppConfig(config)).toThrow(
      "Invalid commerce app config",
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

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should accept metadata.id at exactly 100 characters", () => {
    const config = {
      metadata: {
        id: "a".repeat(MAX_ID_LENGTH),
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should throw when metadata.id exceeds 100 characters", () => {
    const config = {
      metadata: {
        id: "a".repeat(MAX_ID_LENGTH + 1),
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow(
      "Invalid commerce app config",
    );
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

    expect(() => validateCommerceAppConfig(config)).toThrow(
      "Invalid commerce app config",
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

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
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

    expect(() => validateCommerceAppConfig(config)).toThrow(
      "Invalid commerce app config",
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

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test.each([
    { version: "1.0", reason: "Missing patch" },
    { version: "1", reason: "Missing minor and patch" },
    { version: "v1.0.0", reason: "Has 'v' prefix" },
    { version: "1.0.0-beta", reason: "Has prerelease" },
    { version: "1.0.0+build", reason: "Has build metadata" },
    { version: "1.0.0-beta+build", reason: "Has both prerelease and build" },
    { version: "invalid", reason: "Not a version at all" },
  ])("should throw when version is not in semver format: $reason", ({
    version,
  }) => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version,
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow(
      "Invalid commerce app config",
    );
  });

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

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
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

    expect(() => validateCommerceAppConfig(config)).toThrow(
      "Invalid commerce app config",
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

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
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

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
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

    expect(() => validateCommerceAppConfig(config)).toThrow(
      "Invalid commerce app config",
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

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
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

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
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

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
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

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
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

    expect(() => validateCommerceAppConfig(config)).toThrow(
      "Invalid commerce app config",
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

    expect(() => validateCommerceAppConfig(config)).toThrow(
      "Invalid commerce app config",
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

    expect(() => validateCommerceAppConfig(config)).toThrow(
      "Invalid commerce app config",
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

    expect(() => validateCommerceAppConfig(config)).toThrow(
      "Invalid commerce app config",
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

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should validate config with eventing - commerce type", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      eventing: {
        commerce: [
          {
            provider: {
              label: "Commerce Events Provider",
              description: "Provides commerce events",
            },
            events: [
              {
                name: "plugin.order_placed",
                label: "Order Placed",
                fields: [{ name: "order_id" }, { name: "customer_id" }],
                runtimeActions: ["my-package/handle-order"],
                description: "Triggered when an order is placed",
              },
            ],
          },
        ],
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
    const validated = validateCommerceAppConfig(config);
    expect(validated.eventing?.commerce).toHaveLength(1);
  });

  test("should preserve optional commerce event fields in validated output", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      eventing: {
        commerce: [
          {
            provider: {
              label: "Commerce Events Provider",
              description: "Provides commerce events",
            },
            events: [
              {
                name: "plugin.order_placed",
                label: "Order Placed",
                description: "Triggered when an order is placed",
                fields: [{ name: "order_id" }],
                runtimeActions: ["my-package/handle-order"],
                hipaa_audit_required: true,
                destination: "my-destination",
                force: true,
                priority: false,
              },
            ],
          },
        ],
      },
    };

    const validated = validateCommerceAppConfig(config);
    const event = validated.eventing?.commerce?.[0]?.events?.[0];
    expect(event?.hipaa_audit_required).toBe(true);
    expect(event?.destination).toBe("my-destination");
    expect(event?.force).toBe(true);
    expect(event?.priority).toBe(false);
  });

  test("should validate config with eventing - external type", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      eventing: {
        external: [
          {
            provider: {
              label: "External Events Provider",
              description: "Provides external events",
            },
            events: [
              {
                name: "external_event",
                label: "External Event",
                description: "An external event",
                runtimeActions: ["my-package/external-handler"],
              },
            ],
          },
        ],
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
    const validated = validateCommerceAppConfig(config);
    expect(validated.eventing?.external).toHaveLength(1);
  });

  test("should validate config with multiple event sources", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      eventing: {
        commerce: [
          {
            provider: {
              label: "Commerce Provider",
              description: "Commerce events",
            },
            events: [
              {
                name: "observer.catalog_update",
                label: "Catalog Update",
                fields: [{ name: "product_id" }],
                runtimeActions: ["my-package/sync-catalog"],
                description: "Catalog update event",
              },
            ],
          },
        ],
        external: [
          {
            provider: {
              label: "External Provider",
              description: "External events",
            },
            events: [
              {
                name: "webhook_received",
                label: "Webhook Received",
                description: "Webhook event received",
                runtimeActions: ["my-package/webhook-handler"],
              },
            ],
          },
        ],
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
    const validated = validateCommerceAppConfig(config);
    expect(validated.eventing?.commerce).toHaveLength(1);
    expect(validated.eventing?.external).toHaveLength(1);
  });

  test("should validate config with empty eventing object", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      eventing: {},
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should throw when commerce event name does not have required prefix", () => {
    const config = createCommerceEventConfig("invalid_event", {
      // Missing plugin. or observer. prefix
      label: "Invalid Event",
      description: "Invalid event",
    });

    expect(() => validateCommerceAppConfig(config)).toThrow(
      "Invalid commerce app config",
    );
  });

  test("should accept commerce event with plugin prefix", () => {
    const config = createCommerceEventConfig("plugin.my_event");

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should accept commerce event with dot-separated plugin name", () => {
    const config = createCommerceEventConfig(
      "plugin.sales.api.order_management.place",
    );

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should accept commerce event with observer prefix", () => {
    const config = createCommerceEventConfig("observer.my_event", {
      description: "Observer event",
    });

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should throw when provider label exceeds max length", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      eventing: {
        external: [
          {
            provider: {
              label: "A".repeat(101), // Max is 100
              description: "Provider description",
            },
            events: [
              {
                name: "event",
                label: "Event",
                description: "An event",
              },
            ],
          },
        ],
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow(
      "Invalid commerce app config",
    );
  });

  test("should throw when provider description exceeds max length", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      eventing: {
        external: [
          {
            provider: {
              label: "Provider",
              description: "A".repeat(256), // Max is 255
            },
            events: [
              {
                name: "event",
                label: "Event",
                description: "An event",
              },
            ],
          },
        ],
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow(
      "Invalid commerce app config",
    );
  });

  test("should accept provider with optional key", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      eventing: {
        external: [
          {
            provider: {
              label: "Provider",
              description: "Provider description",
              key: "my-provider-key",
            },
            events: [
              {
                name: "event",
                label: "Event",
                description: "An event",
                runtimeActions: ["my-package/event-handler"],
              },
            ],
          },
        ],
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should throw when provider key exceeds max length", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      eventing: {
        external: [
          {
            provider: {
              label: "Provider",
              description: "Provider description",
              key: "A".repeat(51), // Max is 50
            },
            events: [
              {
                name: "event",
                label: "Event",
                description: "An event",
              },
            ],
          },
        ],
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow(
      "Invalid commerce app config",
    );
  });

  test("should throw when commerce event description exceeds max length", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      eventing: {
        commerce: [
          {
            provider: {
              label: "Commerce Provider",
              description: "Commerce events",
            },
            events: [
              {
                name: "plugin.my_event",
                label: "My Event",
                fields: [{ name: "field" }],
                runtimeActions: ["my-package/action"],
                description: "A".repeat(256), // Max is 255
              },
            ],
          },
        ],
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow(
      "Invalid commerce app config",
    );
  });

  test("should throw when commerce event source is missing provider", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      eventing: {
        commerce: [
          {
            // Missing provider
            events: [
              {
                name: "plugin.my_event",
                fields: [{ name: "field" }],
                runtimeAction: "my-package/action",
                description: "Event description",
              },
            ],
          },
        ],
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow(
      "Invalid commerce app config",
    );
  });

  test("should allow any casing in any event runtimeActions as long as it matches package/action format", () => {
    const runtimeActions = [
      "My-Package/My-Action",
      "the-package/the-action",
      "my-Package/mY-AcTiOn",
      "THE-PACKAGE/THE-ACTION",
    ]; // Mixed case, but valid format

    const config = {
      ...minimalValidConfig,
      eventing: {
        commerce: [
          {
            provider: {
              label: "Commerce Provider",
              description: "Commerce events",
            },
            events: [
              {
                name: "plugin.my_event",
                label: "My Event",
                fields: [{ name: "field" }],
                description: "Event description",
                runtimeActions,
              },
            ],
          },
        ],

        external: [
          {
            provider: {
              label: "External Provider",
              description: "External events",
            },
            events: [
              {
                name: "external_event",
                label: "External Event",
                description: "An external event",
                runtimeActions,
              },
            ],
          },
        ],
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should throw when commerce event runtimeAction is not in package/action format", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      eventing: {
        commerce: [
          {
            provider: {
              label: "Commerce Provider",
              description: "Commerce events",
            },
            events: [
              {
                name: "plugin.my_event",
                label: "My Event",
                fields: [{ name: "field" }],
                runtimeActions: ["invalid-action"], // Missing package/ prefix
                description: "Event description",
              },
            ],
          },
        ],
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow(
      "Invalid commerce app config",
    );
  });

  test("should throw when custom installation steps have duplicate names", () => {
    const config = structuredClone(configWithCustomInstallationSteps);
    config.installation.customInstallationSteps.push(
      config.installation.customInstallationSteps[0],
    );

    expect(() => validateCommerceAppConfig(config)).toThrow();
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

    expect(() =>
      validateCommerceAppConfigDomain(metadata, "metadata"),
    ).not.toThrow();
    const validated = validateCommerceAppConfigDomain(metadata, "metadata");
    expect(validated.id).toBe("test-app");
  });

  test("should throw when validating invalid metadata domain", () => {
    const metadata = {
      id: "test app!", // Invalid characters
      displayName: "Test App",
      description: "A test application",
      version: "1.0.0",
    };

    expect(() => validateCommerceAppConfigDomain(metadata, "metadata")).toThrow(
      "Invalid commerce app config: metadata",
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
      validateCommerceAppConfigDomain(businessConfig, "businessConfig"),
    ).not.toThrow();
    const validated = validateCommerceAppConfigDomain(
      businessConfig,
      "businessConfig",
    );
    expect(validated.schema).toHaveLength(1);
  });

  test("should throw when validating invalid businessConfig domain", () => {
    const businessConfig = {
      schema: [], // Empty array is invalid
    };

    expect(() =>
      validateCommerceAppConfigDomain(businessConfig, "businessConfig"),
    ).toThrow("Invalid commerce app config: businessConfig");
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
      validateCommerceAppConfigDomain(schema, "businessConfig.schema"),
    ).not.toThrow();
    const validated = validateCommerceAppConfigDomain(
      schema,
      "businessConfig.schema",
    );
    expect(validated).toHaveLength(2);
  });

  test("should throw when validating invalid businessConfig.schema domain", () => {
    const schema = [
      {
        name: "apiKey",
        // Missing type
      },
    ];

    expect(() =>
      validateCommerceAppConfigDomain(schema, "businessConfig.schema"),
    ).toThrow("Invalid commerce app config: businessConfig.schema");
  });

  test("should throw when validating unknown domain", () => {
    const data = { some: "data" };

    expect(() =>
      // @ts-expect-error - Testing invalid domain
      validateCommerceAppConfigDomain(data, "unknownDomain"),
    ).toThrow();
  });

  test("should validate eventing domain with commerce events", () => {
    const eventing = {
      commerce: [
        {
          provider: {
            label: "My Commerce Provider",
            description: "Provider for commerce events",
          },
          events: [
            {
              name: "plugin.my_event",
              label: "My Event",
              fields: [{ name: "field_one" }, { name: "field_two" }],
              runtimeActions: ["my-package/my-action"],
              description: "My commerce event",
            },
          ],
        },
      ],
    };

    expect(() =>
      validateCommerceAppConfigDomain(eventing, "eventing"),
    ).not.toThrow();
  });

  test("should validate eventing domain with external events", () => {
    const eventing = {
      external: [
        {
          provider: {
            label: "External Provider",
            description: "Provider for external events",
          },
          events: [
            {
              name: "external_event",
              label: "External Event",
              description: "An external event",
              runtimeActions: ["my-package/external-handler"],
            },
          ],
        },
      ],
    };

    expect(() =>
      validateCommerceAppConfigDomain(eventing, "eventing"),
    ).not.toThrow();
  });

  test("should validate eventing domain with empty object", () => {
    const eventing = {};

    expect(() =>
      validateCommerceAppConfigDomain(eventing, "eventing"),
    ).not.toThrow();
  });

  describe("webhooks domain", () => {
    const baseWebhookDefinition = {
      webhook_method: "observer.catalog_product_save_after",
      webhook_type: "after",
      batch_name: "my_batch",
      hook_name: "my_hook",
      method: "POST",
    };

    const baseWebhookEntry = {
      label: "Test Webhook",
      description: "A test webhook",
      category: "append",
    };

    test("should accept entry with runtimeAction and no url", () => {
      const config = {
        metadata: {
          id: "test-app",
          displayName: "Test",
          description: "Test",
          version: "1.0.0",
        },
        webhooks: [
          {
            ...baseWebhookEntry,
            runtimeAction: "my-package/handle-webhook",
            webhook: baseWebhookDefinition,
          },
        ],
      };

      expect(() => validateCommerceAppConfig(config)).not.toThrow();
    });

    test("should accept entry with url and no runtimeAction", () => {
      const config = {
        metadata: {
          id: "test-app",
          displayName: "Test",
          description: "Test",
          version: "1.0.0",
        },
        webhooks: [
          {
            ...baseWebhookEntry,
            webhook: {
              ...baseWebhookDefinition,
              url: "https://example.com/hook",
            },
          },
        ],
      };

      expect(() => validateCommerceAppConfig(config)).not.toThrow();
    });

    test("should reject entry with neither runtimeAction nor url", () => {
      const config = {
        metadata: {
          id: "test-app",
          displayName: "Test",
          description: "Test",
          version: "1.0.0",
        },
        webhooks: [
          {
            ...baseWebhookEntry,
            webhook: baseWebhookDefinition,
          },
        ],
      };

      expect(() => validateCommerceAppConfig(config)).toThrow(
        "Invalid commerce app config",
      );
    });

    test("should accept batch_name and hook_name with only alphanumeric and underscore characters", () => {
      const config = {
        metadata: {
          id: "test-app",
          displayName: "Test",
          description: "Test",
          version: "1.0.0",
        },
        webhooks: [
          {
            ...baseWebhookEntry,
            runtimeAction: "my-package/handle-webhook",
            webhook: {
              ...baseWebhookDefinition,
              batch_name: "my_batch_01",
              hook_name: "hook_1",
            },
          },
        ],
      };

      expect(() => validateCommerceAppConfig(config)).not.toThrow();
    });

    test("should reject batch_name containing invalid characters", () => {
      const config = {
        metadata: {
          id: "test-app",
          displayName: "Test",
          description: "Test",
          version: "1.0.0",
        },
        webhooks: [
          {
            ...baseWebhookEntry,
            runtimeAction: "my-package/handle-webhook",
            webhook: {
              ...baseWebhookDefinition,
              batch_name: "invalid-batch",
            },
          },
        ],
      };

      expect(() => validateCommerceAppConfig(config)).toThrow(
        "Invalid commerce app config",
      );
    });

    test("should reject hook_name containing invalid characters", () => {
      const config = {
        metadata: {
          id: "test-app",
          displayName: "Test",
          description: "Test",
          version: "1.0.0",
        },
        webhooks: [
          {
            ...baseWebhookEntry,
            runtimeAction: "my-package/handle-webhook",
            webhook: {
              ...baseWebhookDefinition,
              hook_name: "invalid hook",
            },
          },
        ],
      };

      expect(() => validateCommerceAppConfig(config)).toThrow(
        "Invalid commerce app config",
      );
    });
  });

  test("should validate commerce event with fields that have optional source", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      eventing: {
        commerce: [
          {
            provider: {
              label: "Commerce Provider",
              description: "Commerce events",
            },
            events: [
              {
                name: "observer.catalog_update",
                label: "Catalog Update",
                fields: [
                  { name: "price" },
                  { name: "_origData" },
                  {
                    name: "quoteId",
                    source: "context_checkout_session.get_quote.get_id",
                  },
                ],
                runtimeActions: ["my-package/sync-catalog"],
                description: "Catalog update event",
              },
            ],
          },
        ],
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });
});
