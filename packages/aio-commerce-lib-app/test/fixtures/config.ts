import { schemaWithDynamicListOptions } from "#test/fixtures/business-config";

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
        label: "Order Events Provider",
        description: "Provides commerce events",
      },
      events: [
        {
          name: "plugin.order_placed",
          label: "Order Placed",
          fields: [{ name: "order_id" }, { name: "customer_id" }],
          rules: [
            { field: "order_total", operator: "greaterThan", value: "100" },
          ],
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
        label: "Third Party Events Provider",
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

/** Config fixture with only order adminUi grid columns configured. */
export const configWithAdminUiSingleGrid = {
  metadata: { ...mockMetadata, id: "test-app-admin-ui-single-grid" },
  adminUi: {
    order: {
      gridColumns: {
        label: "Order fulfillment data",
        description: "Adds fulfillment status to the order grid",
        runtimeAction: "orders/fetch-order-grid-data",
        columns: [
          {
            id: "fulfillment_status",
            label: "Fulfillment",
            type: "string" as const,
            align: "left" as const,
          },
        ],
      },
    },
  },
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with grid columns configured for all three entities (order, product, customer). */
export const configWithAdminUiAllGrids = {
  metadata: { ...mockMetadata, id: "test-app-admin-ui-all-grids" },
  adminUi: {
    order: {
      gridColumns: {
        label: "Order fulfillment data",
        description: "Adds fulfillment status to the order grid",
        runtimeAction: "orders/fetch-order-grid-data",
        columns: [
          {
            id: "fulfillment_status",
            label: "Fulfillment",
            type: "string" as const,
            align: "left" as const,
          },
        ],
      },
    },
    product: {
      gridColumns: {
        label: "Product inventory data",
        description: "Adds inventory status to the product grid",
        runtimeAction: "products/fetch-product-grid-data",
        columns: [
          {
            id: "inventory_status",
            label: "Inventory",
            type: "string" as const,
            align: "left" as const,
          },
        ],
      },
    },
    customer: {
      gridColumns: {
        label: "Customer loyalty data",
        description: "Adds loyalty tier to the customer grid",
        runtimeAction: "customers/fetch-customer-grid-data",
        columns: [
          {
            id: "loyalty_tier",
            label: "Loyalty Tier",
            type: "string" as const,
            align: "left" as const,
          },
        ],
      },
    },
  },
} satisfies CommerceAppConfigOutputModel;

/** Minimal valid adminUi menu object (required fields only). */
const adminUiMenuMinimalPart = {
  id: "approval_dashboard",
  label: "Approval Dashboard",
  description: "Review and approve purchase requests from Commerce Admin.",
} satisfies NonNullable<CommerceAppConfigOutputModel["adminUi"]>["menu"];

/** Full adminUi menu object with all fields populated. */
const adminUiMenuPart = {
  ...adminUiMenuMinimalPart,
  parentMenu: "sales",
  sandboxPermissions: ["allow-popups", "allow-downloads"] as const,
} satisfies NonNullable<CommerceAppConfigOutputModel["adminUi"]>["menu"];

/** Config fixture with an adminUi menu declaration (no grid columns). */
export const configWithAdminUiMenu = {
  metadata: { ...mockMetadata, id: "test-app-admin-ui-menu" },
  adminUi: {
    menu: adminUiMenuPart,
  },
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with only worker mass actions configured (no view mass actions, no grids). */
export const configWithWorkerMassActions = {
  metadata: { ...mockMetadata, id: "test-app-worker-mass-actions" },
  adminUi: {
    customer: {
      massActions: [
        {
          id: "export-customers",
          label: "Export Customers",
          type: "worker" as const,
          runtimeAction: "customers/export-customers",
        },
      ],
    },
  },
} satisfies CommerceAppConfigOutputModel;

/** v2 Admin UI config fixture with view mass actions and no worker. */
export const configWithViewMassActions = {
  metadata: { ...mockMetadata, id: "test-app-admin-ui-sdk-v2" },
  adminUi: {
    order: {
      massActions: [
        {
          id: "order-mass-action",
          label: "Order Mass Action",
          description: "Adds a bulk order action.",
          type: "view" as const,
          path: "#/order-mass-action",
          selectionLimit: 1,
          confirm: { title: "Confirm", message: "Are you sure?" },
          notifications: { success: "Done!" },
        },
      ],
    },
    product: {
      massActions: [
        {
          id: "product-mass-action",
          label: "Product Mass Action",
          type: "view" as const,
          path: "#/product-mass-action",
        },
      ],
    },
    customer: {
      massActions: [
        {
          id: "customer-mass-action",
          label: "Customer Mass Action",
          type: "view" as const,
          path: "#/customer-mass-action",
        },
      ],
    },
  },
} satisfies CommerceAppConfigOutputModel;

/** Full v2 Admin UI config fixture covering all extension points including a worker mass action. */
export const configWithFullAdminUiV2 = {
  metadata: { ...mockMetadata, id: "test-app-full-admin-ui-sdk-v2" },
  adminUi: {
    menu: adminUiMenuPart,
    order: {
      massActions: [
        {
          id: "order-mass-action",
          label: "Order Mass Action",
          description: "Registers an order bulk action.",
          type: "view" as const,
          path: "#/order-mass-action",
          selectionLimit: 1,
          confirm: { title: "Confirm", message: "Are you sure?" },
          notifications: { success: "Done!", error: "Failed!" },
        },
      ],
      gridColumns: {
        label: "Order fulfillment data",
        description: "Adds fulfillment status to the order grid",
        runtimeAction: "orders/fetch-order-data",
        columns: [
          {
            id: "poc_status",
            label: "PoC Status",
            type: "string" as const,
            align: "left" as const,
          },
        ],
      },
    },
    product: {
      massActions: [
        {
          id: "product-mass-action",
          label: "Product Mass Action",
          type: "view" as const,
          path: "#/mass-action",
          selectionLimit: 1,
        },
      ],
    },
    customer: {
      massActions: [
        {
          id: "export-customers",
          label: "Customer Mass Action",
          description: "Exports selected customers.",
          type: "worker" as const,
          runtimeAction: "customers/export-customers",
          timeout: 30,
          selectionLimit: 1,
          notifications: {
            success: "Export complete!",
            error: "Export failed!",
          },
        },
      ],
    },
  },
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with dynamic business config list options. */
export const configWithDynamicListOptions = {
  metadata: { ...mockMetadata, id: "dynamic-list-options-app" },
  businessConfig: { schema: schemaWithDynamicListOptions },
} satisfies CommerceAppConfigOutputModel;
