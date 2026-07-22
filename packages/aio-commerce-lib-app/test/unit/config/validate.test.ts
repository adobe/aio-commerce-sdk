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
} from "#test/fixtures/config";

import type { CommerceEnv } from "@adobe/aio-commerce-lib-core/commerce";

const MAX_ID_LENGTH = 100;
const MAX_DISPLAY_NAME_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 255;

describe("validateConfig", () => {
  test("should validate a complete valid config", () => {
    const config = {
      businessConfig: {
        schema: [
          {
            description: "Your API key",
            label: "API Key",
            name: "apiKey",
            type: "text",
          },
          {
            default: "sandbox",
            label: "Environment",
            name: "environment",
            options: [
              { label: "Production", value: "prod" },
              { label: "Sandbox", value: "sandbox" },
            ],
            selectionMode: "single",
            type: "list",
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
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
        description: "A minimal application",
        displayName: "Minimal App",
        id: "minimal-app",
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

    expect(() => validateCommerceAppConfig(config)).toThrow();
  });

  test("should throw CommerceSdkValidationError when metadata.id is missing", () => {
    const config = {
      metadata: {
        description: "A test application",
        displayName: "Test App",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow();
  });

  test("should throw CommerceSdkValidationError when metadata.id contains invalid characters", () => {
    const config = {
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test app!", // Invalid: contains space and special char
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow();
  });

  test("should accept metadata.id with alphanumeric and dashes", () => {
    const config = {
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app-123",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should accept metadata.id at exactly 100 characters", () => {
    const config = {
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "a".repeat(MAX_ID_LENGTH),
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should throw when metadata.id exceeds 100 characters", () => {
    const config = {
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "a".repeat(MAX_ID_LENGTH + 1),
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow();
  });

  test("should throw when displayName exceeds 50 characters", () => {
    const config = {
      metadata: {
        description: "A test application",
        displayName: "A".repeat(MAX_DISPLAY_NAME_LENGTH + 1),
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow();
  });

  test("should accept displayName with exactly 50 characters", () => {
    const config = {
      metadata: {
        description: "A test application",
        displayName: "A".repeat(MAX_DISPLAY_NAME_LENGTH),
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should throw when description exceeds 255 characters", () => {
    const config = {
      metadata: {
        description: "A".repeat(MAX_DESCRIPTION_LENGTH + 1),
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow();
  });

  test("should accept description with exactly 255 characters", () => {
    const config = {
      metadata: {
        description: "A".repeat(MAX_DESCRIPTION_LENGTH),
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test.each([
    { reason: "Missing patch", version: "1.0" },
    { reason: "Missing minor and patch", version: "1" },
    { reason: "Has 'v' prefix", version: "v1.0.0" },
    { reason: "Has prerelease", version: "1.0.0-beta" },
    { reason: "Has build metadata", version: "1.0.0+build" },
    { reason: "Has both prerelease and build", version: "1.0.0-beta+build" },
    { reason: "Not a version at all", version: "invalid" },
  ])(
    "should throw when version is not in semver format: $reason",
    ({ version }) => {
      const config = {
        metadata: {
          description: "A test application",
          displayName: "Test App",
          id: "test-app",
          version,
        },
      };

      expect(() => validateCommerceAppConfig(config)).toThrow();
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
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version,
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should throw when businessConfig.schema is empty array", () => {
    const config = {
      businessConfig: {
        schema: [], // Empty array - invalid
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow();
  });

  test("should validate text field type", () => {
    const config = {
      businessConfig: {
        schema: [
          {
            default: "default-key",
            description: "Your API key",
            label: "API Key",
            name: "apiKey",
            type: "text",
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should validate email field type", () => {
    const config = {
      businessConfig: {
        schema: [
          {
            default: "test@example.com",
            label: "Contact Email",
            name: "contactEmail",
            type: "email",
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should throw when email field has invalid default email", () => {
    const config = {
      businessConfig: {
        schema: [
          {
            default: "not-an-email", // Invalid email
            label: "Contact Email",
            name: "contactEmail",
            type: "email",
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow();
  });

  test("should validate url field type", () => {
    const config = {
      businessConfig: {
        schema: [
          {
            default: "https://example.com/webhook",
            label: "Webhook URL",
            name: "webhookUrl",
            type: "url",
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should validate tel field type", () => {
    const config = {
      businessConfig: {
        schema: [
          {
            default: "+1-555-123-4567",
            label: "Support Phone",
            name: "supportPhone",
            type: "tel",
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should validate list field with single selection", () => {
    const config = {
      businessConfig: {
        schema: [
          {
            default: "sandbox",
            label: "Environment",
            name: "environment",
            options: [
              { label: "Production", value: "prod" },
              { label: "Sandbox", value: "sandbox" },
            ],
            selectionMode: "single",
            type: "list",
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should validate list field with multiple selection", () => {
    const config = {
      businessConfig: {
        schema: [
          {
            default: ["feature_a"],
            label: "Enabled Features",
            name: "features",
            options: [
              { label: "Feature A", value: "feature_a" },
              { label: "Feature B", value: "feature_b" },
            ],
            selectionMode: "multiple",
            type: "list",
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should throw when list field with single selection has array default", () => {
    const config = {
      businessConfig: {
        schema: [
          {
            default: ["sandbox"], // Should be string, not array
            label: "Environment",
            name: "environment",
            options: [
              { label: "Production", value: "prod" },
              { label: "Sandbox", value: "sandbox" },
            ],
            selectionMode: "single",
            type: "list",
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow();
  });

  test("should throw when list field with multiple selection has string default", () => {
    const config = {
      businessConfig: {
        schema: [
          {
            default: "feature_a", // Should be array, not string
            label: "Enabled Features",
            name: "features",
            options: [
              { label: "Feature A", value: "feature_a" },
              { label: "Feature B", value: "feature_b" },
            ],
            selectionMode: "multiple",
            type: "list",
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow();
  });

  test("should throw when schema field is missing required name", () => {
    const config = {
      businessConfig: {
        schema: [
          {
            label: "Some Field",
            type: "text",
            // Missing 'name'
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow();
  });

  test("should throw when schema field is missing required type", () => {
    const config = {
      businessConfig: {
        schema: [
          {
            label: "Some Field",
            name: "someField",
            // Missing 'type'
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow();
  });

  test("should accept schema field without optional label", () => {
    const config = {
      businessConfig: {
        schema: [
          {
            name: "someField",
            type: "text",
            // label is optional
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should validate config with eventing - commerce type", () => {
    const config = createCommerceEventConfig("plugin.order_placed", {
      description: "Triggered when an order is placed",
      fields: [{ name: "order_id" }, { name: "customer_id" }],
      label: "Order Placed",
      runtimeActions: ["my-package/handle-order"],
    });

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
    const validated = validateCommerceAppConfig(config);
    expect(validated.eventing?.commerce).toHaveLength(1);
  });

  test("should preserve optional commerce event fields in validated output", () => {
    const config = {
      eventing: {
        commerce: [
          {
            events: [
              {
                description: "Triggered when an order is placed",
                destination: "my-destination",
                fields: [{ name: "order_id" }],
                force: true,
                hipaa_audit_required: true,
                label: "Order Placed",
                name: "plugin.order_placed",
                priority: false,
                runtimeActions: ["my-package/handle-order"],
              },
            ],
            provider: {
              description: "Provides commerce events",
              label: "Commerce Events Provider",
            },
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
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
      eventing: {
        external: [
          {
            events: [
              {
                description: "An external event",
                label: "External Event",
                name: "external_event",
                runtimeActions: ["my-package/external-handler"],
              },
            ],
            provider: {
              description: "Provides external events",
              label: "External Events Provider",
            },
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
    const validated = validateCommerceAppConfig(config);
    expect(validated.eventing?.external).toHaveLength(1);
  });

  test("should validate config with multiple event sources", () => {
    const config = {
      eventing: {
        commerce: [
          {
            events: [
              {
                description: "Catalog update event",
                fields: [{ name: "product_id" }],
                label: "Catalog Update",
                name: "observer.catalog_update",
                runtimeActions: ["my-package/sync-catalog"],
              },
            ],
            provider: {
              description: "Commerce events",
              label: "Commerce Provider",
            },
          },
        ],
        external: [
          {
            events: [
              {
                description: "Webhook event received",
                label: "Webhook Received",
                name: "webhook_received",
                runtimeActions: ["my-package/webhook-handler"],
              },
            ],
            provider: {
              description: "External events",
              label: "External Provider",
            },
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
    const validated = validateCommerceAppConfig(config);
    expect(validated.eventing?.commerce).toHaveLength(1);
    expect(validated.eventing?.external).toHaveLength(1);
  });

  test("should validate config with empty eventing object", () => {
    const config = {
      eventing: {},
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should throw when commerce event name does not have required prefix", () => {
    const config = createCommerceEventConfig("invalid_event", {
      description: "Invalid event",
      // Missing plugin. or observer. prefix
      label: "Invalid Event",
    });

    expect(() => validateCommerceAppConfig(config)).toThrow();
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
      eventing: {
        external: [
          {
            events: [
              {
                description: "An event",
                label: "Event",
                name: "event",
              },
            ],
            provider: {
              description: "Provider description",
              label: "A".repeat(101), // Max is 100
            },
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow();
  });

  test("should throw when provider description exceeds max length", () => {
    const config = {
      eventing: {
        external: [
          {
            events: [
              {
                description: "An event",
                label: "Event",
                name: "event",
              },
            ],
            provider: {
              description: "A".repeat(256), // Max is 255
              label: "Provider",
            },
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow();
  });

  test("should accept provider with optional key", () => {
    const config = {
      eventing: {
        external: [
          {
            events: [
              {
                description: "An event",
                label: "Event",
                name: "event",
                runtimeActions: ["my-package/event-handler"],
              },
            ],
            provider: {
              description: "Provider description",
              key: "my-provider-key",
              label: "Provider",
            },
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should throw when provider key exceeds max length", () => {
    const config = {
      eventing: {
        external: [
          {
            events: [
              {
                description: "An event",
                label: "Event",
                name: "event",
              },
            ],
            provider: {
              description: "Provider description",
              key: "A".repeat(51), // Max is 50
              label: "Provider",
            },
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow();
  });

  test("should throw when provider label contains invalid characters", () => {
    const config = {
      eventing: {
        external: [
          {
            events: [
              {
                description: "An event",
                label: "Event",
                name: "event",
                runtimeActions: ["my-package/event-handler"],
              },
            ],
            provider: {
              description: "Provider description",
              label: "Catalog & Sales Rules Events", // & is not a valid character
            },
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow();
  });

  test("should throw when provider description contains invalid characters", () => {
    const config = {
      eventing: {
        external: [
          {
            events: [
              {
                description: "An event",
                label: "Event",
                name: "event",
                runtimeActions: ["my-package/event-handler"],
              },
            ],
            provider: {
              description: "Events for <Commerce>", // < and > are not valid characters
              label: "Provider",
            },
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow();
  });

  test("should accept provider label with all valid special characters", () => {
    const config = {
      eventing: {
        external: [
          {
            events: [
              {
                description: "An event",
                label: "Event",
                name: "event",
                runtimeActions: ["my-package/event-handler"],
              },
            ],
            provider: {
              description: "Provider description",
              label: "Events: (Commerce) v1.0, @Adobe / sales_rules-test.v2",
            },
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should throw when two commerce providers share the same label", () => {
    const config = {
      eventing: {
        commerce: [
          {
            events: [
              {
                description: "An event",
                fields: [{ name: "order_id" }],
                label: "Order Placed",
                name: "plugin.order_placed",
                runtimeActions: ["my-package/handle-order"],
              },
            ],
            provider: { description: "First provider", label: "Order Events" },
          },
          {
            events: [
              {
                description: "An event",
                fields: [{ name: "order_id" }],
                label: "Order Cancelled",
                name: "plugin.order_cancelled",
                runtimeActions: ["my-package/handle-order"],
              },
            ],
            provider: { description: "Second provider", label: "Order Events" },
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow();
  });

  test("should throw when two external providers share the same label", () => {
    const config = {
      eventing: {
        external: [
          {
            events: [
              {
                description: "An event",
                label: "Event One",
                name: "event_one",
                runtimeActions: ["my-package/handle-event"],
              },
            ],
            provider: {
              description: "First provider",
              label: "External Events",
            },
          },
          {
            events: [
              {
                description: "An event",
                label: "Event Two",
                name: "event_two",
                runtimeActions: ["my-package/handle-event"],
              },
            ],
            provider: {
              description: "Second provider",
              label: "External Events",
            },
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow();
  });

  test("should throw when commerce event description exceeds max length", () => {
    const config = createCommerceEventConfig("plugin.my_event", {
      description: "A".repeat(256), // Max is 255
    });

    expect(() => validateCommerceAppConfig(config)).toThrow();
  });

  test("should throw when commerce event source is missing provider", () => {
    const config = {
      eventing: {
        commerce: [
          {
            // Missing provider
            events: [
              {
                description: "Event description",
                fields: [{ name: "field" }],
                name: "plugin.my_event",
                runtimeAction: "my-package/action",
              },
            ],
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).toThrow();
  });

  test("should allow any casing in any event runtimeActions as long as it matches package/action format", () => {
    const runtimeActions = [
      "My-Package/My-Action",
      "the-package/the-action",
      "my-Package/mY-AcTiOn",
      "THE-PACKAGE/THE-ACTION",
    ]; // Mixed case, but valid format

    const base = createCommerceEventConfig("plugin.my_event", {
      description: "Event description",
      runtimeActions,
    });
    const config = {
      ...base,
      eventing: {
        ...base.eventing,
        external: [
          {
            events: [
              {
                description: "An external event",
                label: "External Event",
                name: "external_event",
                runtimeActions,
              },
            ],
            provider: {
              description: "External events",
              label: "External Provider",
            },
          },
        ],
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should throw when commerce event runtimeAction is not in package/action format", () => {
    const config = createCommerceEventConfig("plugin.my_event", {
      runtimeActions: ["invalid-action"], // Missing package/ prefix
    });

    expect(() => validateCommerceAppConfig(config)).toThrow();
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
      description: "A test application",
      displayName: "Test App",
      id: "test-app",
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
      description: "A test application",
      displayName: "Test App",
      id: "test app!", // Invalid characters
      version: "1.0.0",
    };

    expect(() =>
      validateCommerceAppConfigDomain(metadata, "metadata"),
    ).toThrow();
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
    ).toThrow();
  });

  test("should validate businessConfig.schema domain", () => {
    const schema = [
      {
        name: "apiKey",
        type: "text",
      },
      {
        default: "sandbox",
        label: "Environment",
        name: "environment",
        options: [
          { label: "Production", value: "prod" },
          { label: "Sandbox", value: "sandbox" },
        ],
        selectionMode: "single",
        type: "list",
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
    ).toThrow();
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
          events: [
            {
              description: "My commerce event",
              fields: [{ name: "field_one" }, { name: "field_two" }],
              label: "My Event",
              name: "plugin.my_event",
              runtimeActions: ["my-package/my-action"],
            },
          ],
          provider: {
            description: "Provider for commerce events",
            label: "My Commerce Provider",
          },
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
          events: [
            {
              description: "An external event",
              label: "External Event",
              name: "external_event",
              runtimeActions: ["my-package/external-handler"],
            },
          ],
          provider: {
            description: "Provider for external events",
            label: "External Provider",
          },
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
      batch_name: "my_batch",
      hook_name: "my_hook",
      method: "POST",
      webhook_method: "observer.catalog_product_save_after",
      webhook_type: "after",
    };

    const baseWebhookEntry = {
      category: "append",
      description: "A test webhook",
      label: "Test Webhook",
    };

    test("should accept entry with runtimeAction and no url", () => {
      const config = {
        metadata: {
          description: "Test",
          displayName: "Test",
          id: "test-app",
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
          description: "Test",
          displayName: "Test",
          id: "test-app",
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
          description: "Test",
          displayName: "Test",
          id: "test-app",
          version: "1.0.0",
        },
        webhooks: [
          {
            ...baseWebhookEntry,
            webhook: baseWebhookDefinition,
          },
        ],
      };

      expect(() => validateCommerceAppConfig(config)).toThrow();
    });

    test("should accept batch_name and hook_name with only alphanumeric and underscore characters", () => {
      const config = {
        metadata: {
          description: "Test",
          displayName: "Test",
          id: "test-app",
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
          description: "Test",
          displayName: "Test",
          id: "test-app",
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

      expect(() => validateCommerceAppConfig(config)).toThrow();
    });

    test("should reject hook_name containing invalid characters", () => {
      const config = {
        metadata: {
          description: "Test",
          displayName: "Test",
          id: "test-app",
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

      expect(() => validateCommerceAppConfig(config)).toThrow();
    });

    test.each([["paas"], ["saas"], ["paas", "saas"]])(
      "should accept entry scoped to env %j",
      (...env) => {
        const config = {
          metadata: {
            description: "Test",
            displayName: "Test",
            id: "test-app",
            version: "1.0.0",
          },
          webhooks: [
            {
              ...baseWebhookEntry,
              env,
              runtimeAction: "my-package/handle-webhook",
              webhook: baseWebhookDefinition,
            },
          ],
        };

        expect(() => validateCommerceAppConfig(config)).not.toThrow();
        const validated = validateCommerceAppConfig(config);
        expect(validated.webhooks?.[0]?.env).toEqual(env);
      },
    );

    test("should reject an empty env array", () => {
      const config = {
        metadata: {
          description: "Test",
          displayName: "Test",
          id: "test-app",
          version: "1.0.0",
        },
        webhooks: [
          {
            ...baseWebhookEntry,
            env: [],
            runtimeAction: "my-package/handle-webhook",
            webhook: baseWebhookDefinition,
          },
        ],
      };

      expect(() => validateCommerceAppConfig(config)).toThrow();
    });

    test("should reject an unknown env value", () => {
      const config = {
        metadata: {
          description: "Test",
          displayName: "Test",
          id: "test-app",
          version: "1.0.0",
        },
        webhooks: [
          {
            ...baseWebhookEntry,
            env: ["onprem"],
            runtimeAction: "my-package/handle-webhook",
            webhook: baseWebhookDefinition,
          },
        ],
      };

      expect(() => validateCommerceAppConfig(config)).toThrow();
    });
  });

  describe("event env scoping", () => {
    test("should accept a commerce event scoped to an environment", () => {
      const config = createCommerceEventConfig("plugin.my_event", {
        env: ["saas"],
      });

      expect(() => validateCommerceAppConfig(config)).not.toThrow();
      const validated = validateCommerceAppConfig(config);
      expect(validated.eventing?.commerce?.[0]?.events?.[0]?.env).toEqual([
        "saas",
      ]);
    });

    test("should reject a commerce event with an empty env array", () => {
      const config = createCommerceEventConfig("plugin.my_event", { env: [] });
      expect(() => validateCommerceAppConfig(config)).toThrow();
    });

    test("should reject a commerce event with an unknown env value", () => {
      const config = createCommerceEventConfig("plugin.my_event", {
        env: ["onprem"] as unknown as CommerceEnv[],
      });
      expect(() => validateCommerceAppConfig(config)).toThrow();
    });
  });

  test("should validate commerce event with fields that have optional source", () => {
    const config = {
      eventing: {
        commerce: [
          {
            events: [
              {
                description: "Catalog update event",
                fields: [
                  { name: "price" },
                  { name: "_origData" },
                  {
                    name: "quoteId",
                    source: "context_checkout_session.get_quote.get_id",
                  },
                ],
                label: "Catalog Update",
                name: "observer.catalog_update",
                runtimeActions: ["my-package/sync-catalog"],
              },
            ],
            provider: {
              description: "Commerce events",
              label: "Commerce Provider",
            },
          },
        ],
      },
      metadata: {
        description: "A test application",
        displayName: "Test App",
        id: "test-app",
        version: "1.0.0",
      },
    };

    expect(() => validateCommerceAppConfig(config)).not.toThrow();
  });

  test("should throw when commerce event fields array is empty", () => {
    const config = createCommerceEventConfig("observer.order_placed", {
      fields: [],
    });

    expect(() => validateCommerceAppConfig(config)).toThrow();
  });
});
