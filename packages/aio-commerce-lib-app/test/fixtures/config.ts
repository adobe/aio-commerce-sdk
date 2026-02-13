import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** Base metadata for test configs. */
export const mockMetadata = {
  id: "test-app",
  displayName: "Test App",
  description: "A test application",
  version: "1.0.0",
};

/** Commerce eventing configuration part. */
const commerceEventingPart = {
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
          fields: ["order_id", "customer_id"],
          runtimeActions: ["my-package/handle-order"],
          description: "Triggered when an order is placed",
        },
      ],
    },
  ],
};

/** External eventing configuration part. */
const externalEventingPart = {
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
          runtimeActions: ["my-package/handle-external-event"],
        },
      ],
    },
  ],
};

/** Webhooks configuration part. */
const webhooksPart = [
  {
    name: "order.created",
    url: "https://example.com/webhook",
  },
];

/** Minimal valid config with only required metadata fields. */
export const minimalValidConfig: CommerceAppConfigOutputModel = {
  metadata: mockMetadata,
};

/** Config fixture with eventing.commerce configured. */
export const configWithCommerceEventing: CommerceAppConfigOutputModel = {
  metadata: { ...mockMetadata, id: "test-app-commerce-events" },
  eventing: commerceEventingPart,
};

/** Config fixture with eventing.external configured. */
export const configWithExternalEventing: CommerceAppConfigOutputModel = {
  metadata: { ...mockMetadata, id: "test-app-external-events" },
  eventing: externalEventingPart,
};

/** Config fixture with webhooks configured. */
export const configWithWebhooks: CommerceAppConfigOutputModel & {
  webhooks: unknown[];
} = {
  metadata: { ...mockMetadata, id: "test-app-webhooks" },
  webhooks: webhooksPart,
};

/** Config fixture with both commerce and external eventing. */
export const configWithFullEventing: CommerceAppConfigOutputModel = {
  metadata: { ...mockMetadata, id: "test-app-full-eventing" },
  eventing: {
    ...commerceEventingPart,
    ...externalEventingPart,
  },
};

/** Config fixture with both eventing and webhooks configured. */
export const configWithEventingAndWebhooks: CommerceAppConfigOutputModel & {
  webhooks: unknown[];
} = {
  metadata: { ...mockMetadata, id: "test-app-full" },
  eventing: {
    ...commerceEventingPart,
    ...externalEventingPart,
  },
  webhooks: webhooksPart,
};

/** Config fixture with custom installation steps. */
export const configWithCustomInstallationSteps: CommerceAppConfigOutputModel = {
  metadata: { ...mockMetadata, id: "test-app-with-custom-installation-steps" },
  installation: {
    customInstallationSteps: [
      {
        script: "./demo-success.js",
        name: "Demo Success",
        description: "Success script",
      },
      {
        script: "./demo-error.js",
        name: "Demo Error",
        description: "Error script",
      },
    ],
  },
};
