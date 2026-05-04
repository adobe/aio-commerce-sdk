import type { ApplicationMetadata } from "#config/index";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** Base metadata for test configs. */
export const mockMetadata = {
  id: "test-app",
  displayName: "Test App",
  description: "A test application",
  version: "1.0.0",
} satisfies ApplicationMetadata;

/** Business configuration part */
const businessConfigPart = {
  schema: [
    {
      name: "testField",
      label: "Test Field",
      type: "text",
      default: "default value",
    },
  ],
} satisfies CommerceAppConfigOutputModel["businessConfig"];

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
          fields: [{ name: "order_id" }, { name: "customer_id" }],
          runtimeActions: ["my-package/handle-order"],
          description: "Triggered when an order is placed",
        },
      ],
    },
  ],
} satisfies CommerceAppConfigOutputModel["eventing"];

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
} satisfies CommerceAppConfigOutputModel["eventing"];

/** Webhooks configuration part. */
const webhooksPart = [
  {
    label: "Order Created Webhook",
    description: "Webhook for order created",
    runtimeAction: "my-package/handle-webhook",
    requireAdobeAuth: true,
    category: "modification" as const,
    webhook: {
      webhook_method: "plugin.order.api.order_created",
      webhook_type: "after",
      batch_name: "default",
      hook_name: "order_created",
      method: "POST",
    },
  },
] satisfies CommerceAppConfigOutputModel["webhooks"];

const installationPart = {
  messages: {
    preInstallation: "Preparing to install",
    postInstallation: "Installation complete",
  },

  customInstallationSteps: [
    {
      script: "./my-script.js",
      name: "My Script",
      description: "A test script",
    },
  ],
} satisfies CommerceAppConfigOutputModel["installation"];

/** Minimal valid config with only required metadata fields. */
export const minimalValidConfig = {
  metadata: mockMetadata,
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with business configuration. */
export const configWithBusinessConfig = {
  metadata: { ...mockMetadata, id: "test-app-business-config" },
  businessConfig: businessConfigPart,
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with eventing.commerce configured. */
export const configWithCommerceEventing = {
  metadata: { ...mockMetadata, id: "test-app-commerce-events" },
  eventing: commerceEventingPart,
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with eventing.external configured. */
export const configWithExternalEventing = {
  metadata: { ...mockMetadata, id: "test-app-external-events" },
  eventing: externalEventingPart,
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with Admin UI SDK configured. */
export const configWithAdminUiSdk = {
  metadata: { ...mockMetadata, id: "test-app-admin-ui-sdk" },
  adminUiSdk: {
    registration: {
      menuItems: [
        {
          id: "test-app::menu",
          title: "Test App",
          sortOrder: 1,
          isSection: false,
        },
      ],
      order: {
        massActions: [
          {
            actionId: "test-app::order-mass-action",
            label: "Order Mass Action",
            path: "#/order-mass-action",
            selectionLimit: 1,
            confirm: { title: "Confirm", message: "Are you sure?" },
          },
        ],
        gridColumns: {
          data: { meshId: "mesh-123" },
          properties: [
            {
              label: "Col 1",
              columnId: "col_1",
              type: "string",
              align: "left",
            },
          ],
        },
        viewButtons: [
          {
            buttonId: "test-app::delete-order",
            label: "Delete",
            path: "#/delete",
            level: 0,
            confirm: { message: "Are you sure?" },
          },
        ],
        customFees: [
          {
            id: "test-app::fee",
            label: "Test Fee",
            value: 5.0,
            applyFeeOnLastCreditMemo: false,
          },
        ],
      },
      product: {
        massActions: [
          {
            actionId: "test-app::product-mass-action",
            label: "Product Mass Action",
            path: "#/product-mass-action",
          },
        ],
        gridColumns: {
          data: { meshId: "mesh-456" },
          properties: [
            { label: "Col", columnId: "col", type: "integer", align: "right" },
          ],
        },
      },
      customer: {
        massActions: [
          {
            actionId: "test-app::customer-mass-action",
            label: "Customer Mass Action",
            path: "#/customer-mass-action",
          },
        ],
        gridColumns: {
          data: { meshId: "mesh-789" },
          properties: [
            { label: "Col", columnId: "col", type: "boolean", align: "center" },
          ],
        },
      },
      bannerNotification: {
        massActions: {
          order: [
            {
              actionId: "test-app::order-mass-action",
              successMessage: "Done!",
            },
          ],
        },
        orderViewButtons: [
          {
            buttonId: "test-app::delete-order",
            successMessage: "Done!",
            errorMessage: "Failed!",
          },
        ],
      },
    },
  },
} satisfies CommerceAppConfigOutputModel;

/** Full Admin UI SDK config fixture covering all extension points. */
export const configWithFullAdminUiSdk = {
  metadata: { ...mockMetadata, id: "test-app-full-admin-ui-sdk" },
  adminUiSdk: {
    registration: {
      menuItems: [
        {
          id: "my-app::first",
          title: "App on App Builder",
          parent: "my-app::apps",
          sortOrder: 1,
          isSection: false,
          sandbox: "allow-modals",
          aclResource: {
            id: "Acme_Promotions::dashboard",
            title: "Promotions Dashboard",
          },
        },
      ],
      order: {
        massActions: [
          {
            actionId: "my-app::order-mass-action",
            label: "Order Mass Action",
            title: "Page Title",
            confirm: { title: "Confirm", message: "Are you sure?" },
            path: "#/order-mass-action",
            selectionLimit: 1,
            displayIframe: true,
            timeout: 10,
            sandbox: "allow-modals",
          },
        ],
        gridColumns: {
          data: { meshId: "MESH_ID" },
          properties: [
            {
              label: "Column Name",
              columnId: "column_id",
              type: "string" as const,
              align: "left" as const,
            },
          ],
        },
        viewButtons: [
          {
            buttonId: "my-app::delete-order",
            label: "Delete",
            confirm: { message: "Are you sure?" },
            path: "#/delete-order",
            level: 0 as const,
            sortOrder: 80,
            displayIframe: true,
            timeout: 10,
            sandbox: "allow-modals",
          },
        ],
        customFees: [
          {
            id: "fee-1",
            label: "Test Fee",
            value: 1.0,
            orderMinimumAmount: 0,
            applyFeeOnLastInvoice: false,
            applyFeeOnLastCreditMemo: true,
          },
        ],
      },
      product: {
        massActions: [
          {
            actionId: "my-app::product-mass-action",
            label: "Product Mass Action",
            path: "#/mass-action",
            productSelectLimit: 1,
          },
        ],
        gridColumns: {
          data: { meshId: "MESH_ID" },
          properties: [
            {
              label: "Column",
              columnId: "col_id",
              type: "string" as const,
              align: "left" as const,
            },
          ],
        },
      },
      customer: {
        massActions: [
          {
            actionId: "my-app::customer-mass-action",
            label: "Customer Mass Action",
            path: "#/customer-mass-action",
            customerSelectLimit: 1,
          },
        ],
        gridColumns: {
          data: { meshId: "MESH_ID" },
          properties: [
            {
              label: "Column",
              columnId: "col_id",
              type: "string" as const,
              align: "left" as const,
            },
          ],
        },
      },
      bannerNotification: {
        massActions: {
          order: [
            {
              actionId: "my-app::order-mass-action",
              successMessage: "Done!",
              errorMessage: "Failed!",
            },
          ],
          product: [{ actionId: "my-app::product-mass-action" }],
          customer: [{ actionId: "my-app::customer-mass-action" }],
        },
        orderViewButtons: [
          {
            buttonId: "my-app::delete-order",
            successMessage: "Done!",
            errorMessage: "Failed!",
          },
        ],
      },
    },
  },
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with webhooks configured. */
export const configWithWebhooks = {
  metadata: { ...mockMetadata, id: "test-app-webhooks" },
  webhooks: webhooksPart,
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with both commerce and external eventing. */
export const configWithFullEventing = {
  metadata: { ...mockMetadata, id: "test-app-full-eventing" },
  eventing: {
    ...commerceEventingPart,
    ...externalEventingPart,
  },
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with both eventing and webhooks configured. */
export const configWithEventingAndWebhooks = {
  metadata: { ...mockMetadata, id: "test-app-full" },
  eventing: {
    ...commerceEventingPart,
    ...externalEventingPart,
  },
  webhooks: webhooksPart,
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with a single custom installation script — for focused workflow tests. */
export const configWithOneScript = {
  metadata: { ...mockMetadata, id: "test-one-script" },
  installation: installationPart,
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with custom installation steps. */
export const configWithCustomInstallationSteps = {
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
} satisfies CommerceAppConfigOutputModel;

/** Full config fixture with all parts configured. */
export const fullConfig = {
  metadata: { ...mockMetadata, id: "full-config-app" },
  businessConfig: businessConfigPart,
  eventing: {
    ...commerceEventingPart,
    ...externalEventingPart,
  },

  webhooks: webhooksPart,
  installation: installationPart,
} satisfies CommerceAppConfigOutputModel;

export function createMockMetadata(
  id: string,
  overrides: Partial<ApplicationMetadata> = {},
): ApplicationMetadata {
  return {
    ...mockMetadata,
    id,
    ...overrides,
  };
}

export function createCommerceEventConfig(
  name: string,
  overrides?: Partial<{
    label: string;
    description: string;
    runtimeActions: string[];
    fields: Array<{ name: string }>;
  }>,
) {
  return {
    metadata: minimalValidConfig.metadata,
    eventing: {
      commerce: [
        {
          provider: {
            label: "Commerce Provider",
            description: "Commerce events",
          },
          events: [
            {
              name,
              label: overrides?.label ?? "My Event",
              fields: overrides?.fields ?? [{ name: "field" }],
              runtimeActions: overrides?.runtimeActions ?? [
                "my-package/action",
              ],
              description: overrides?.description ?? "Plugin event",
            },
          ],
        },
      ],
    },
  };
}

export function createConfigWithTwoCommerceEventingSources() {
  return {
    ...configWithCommerceEventing,
    eventing: {
      commerce: [
        ...configWithCommerceEventing.eventing.commerce,
        {
          provider: {
            label: "Second Commerce Events Provider",
            description: "Provides additional commerce events",
          },
          events: [
            {
              name: "plugin.order_cancelled",
              label: "Order Cancelled",
              fields: [{ name: "order_id" }],
              runtimeActions: ["my-package/handle-order-cancelled"],
              description: "Triggered when an order is cancelled",
            },
          ],
        },
      ],
    },
  } satisfies CommerceAppConfigOutputModel;
}
