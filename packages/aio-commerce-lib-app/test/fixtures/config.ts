import { schemaWithDynamicListOptions } from "#test/fixtures/business-config";

import type { CommerceEnv } from "@adobe/aio-commerce-lib-core/commerce";
import type { ApplicationMetadata } from "#config/index";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** Base metadata for test configs. */
export const mockMetadata = {
  description: "A test application",
  displayName: "Test App",
  id: "test-app",
  version: "1.0.0",
} satisfies ApplicationMetadata;

/** Business configuration part */
const businessConfigPart = {
  schema: [
    {
      default: "default value",
      label: "Test Field",
      name: "testField",
      type: "text",
    },
  ],
} satisfies CommerceAppConfigOutputModel["businessConfig"];

/** Commerce eventing configuration part. */
const commerceEventingPart = {
  commerce: [
    {
      events: [
        {
          description: "Triggered when an order is placed",
          fields: [{ name: "order_id" }, { name: "customer_id" }],
          label: "Order Placed",
          name: "plugin.order_placed",
          rules: [
            { field: "order_total", operator: "greaterThan", value: "100" },
          ],
          runtimeActions: ["my-package/handle-order"],
        },
      ],
      provider: {
        description: "Provides commerce events",
        label: "Order Events Provider",
      },
    },
  ],
} satisfies CommerceAppConfigOutputModel["eventing"];

/** External eventing configuration part. */
const externalEventingPart = {
  external: [
    {
      events: [
        {
          description: "An external event",
          label: "External Event",
          name: "external_event",
          runtimeActions: ["my-package/handle-external-event"],
        },
      ],
      provider: {
        description: "Provides external events",
        label: "Third Party Events Provider",
      },
    },
  ],
} satisfies CommerceAppConfigOutputModel["eventing"];

/** Webhooks configuration part. */
const webhooksPart = [
  {
    category: "modification" as const,
    description: "Webhook for order created",
    label: "Order Created Webhook",
    requireAdobeAuth: true,
    runtimeAction: "my-package/handle-webhook",
    webhook: {
      batch_name: "default",
      hook_name: "order_created",
      method: "POST",
      webhook_method: "plugin.order.api.order_created",
      webhook_type: "after",
    },
  },
] satisfies CommerceAppConfigOutputModel["webhooks"];

const installationPart = {
  customInstallationSteps: [
    {
      description: "A test script",
      name: "My Script",
      script: "./my-script.js",
    },
  ],
  messages: {
    postInstallation: "Installation complete",
    preInstallation: "Preparing to install",
  },
} satisfies CommerceAppConfigOutputModel["installation"];

/** Minimal valid config with only required metadata fields. */
export const minimalValidConfig = {
  metadata: mockMetadata,
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with business configuration. */
export const configWithBusinessConfig = {
  businessConfig: businessConfigPart,
  metadata: { ...mockMetadata, id: "test-app-business-config" },
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with eventing.commerce configured. */
export const configWithCommerceEventing = {
  eventing: commerceEventingPart,
  metadata: { ...mockMetadata, id: "test-app-commerce-events" },
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with eventing.external configured. */
export const configWithExternalEventing = {
  eventing: externalEventingPart,
  metadata: { ...mockMetadata, id: "test-app-external-events" },
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with webhooks configured. */
export const configWithWebhooks = {
  metadata: { ...mockMetadata, id: "test-app-webhooks" },
  webhooks: webhooksPart,
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with both commerce and external eventing. */
export const configWithFullEventing = {
  eventing: {
    ...commerceEventingPart,
    ...externalEventingPart,
  },
  metadata: { ...mockMetadata, id: "test-app-full-eventing" },
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with both eventing and webhooks configured. */
export const configWithEventingAndWebhooks = {
  eventing: {
    ...commerceEventingPart,
    ...externalEventingPart,
  },
  metadata: { ...mockMetadata, id: "test-app-full" },
  webhooks: webhooksPart,
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with a single custom installation script — for focused workflow tests. */
export const configWithOneScript = {
  installation: installationPart,
  metadata: { ...mockMetadata, id: "test-one-script" },
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with custom installation steps. */
export const configWithCustomInstallationSteps = {
  installation: {
    customInstallationSteps: [
      {
        description: "Success script",
        name: "Demo Success",
        script: "./demo-success.js",
      },
      {
        description: "Error script",
        name: "Demo Error",
        script: "./demo-error.js",
      },
    ],
  },
  metadata: { ...mockMetadata, id: "test-app-with-custom-installation-steps" },
} satisfies CommerceAppConfigOutputModel;

/** Full config fixture with all parts configured. */
export const fullConfig = {
  businessConfig: businessConfigPart,
  eventing: {
    ...commerceEventingPart,
    ...externalEventingPart,
  },
  installation: installationPart,
  metadata: { ...mockMetadata, id: "full-config-app" },

  webhooks: webhooksPart,
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
    env: CommerceEnv[];
  }>,
) {
  return {
    eventing: {
      commerce: [
        {
          events: [
            {
              description: overrides?.description ?? "Plugin event",
              fields: overrides?.fields ?? [{ name: "field" }],
              label: overrides?.label ?? "My Event",
              name,
              runtimeActions: overrides?.runtimeActions ?? [
                "my-package/action",
              ],
              ...(overrides?.env !== undefined && { env: overrides.env }),
            },
          ],
          provider: {
            description: "Commerce events",
            label: "Commerce Provider",
          },
        },
      ],
    },
    metadata: minimalValidConfig.metadata,
  };
}

export function createExternalEventConfig(
  name: string,
  overrides?: Partial<{
    label: string;
    description: string;
    runtimeActions: string[];
    env: CommerceEnv[];
  }>,
) {
  return {
    eventing: {
      external: [
        {
          events: [
            {
              description: overrides?.description ?? "An external event",
              label: overrides?.label ?? "External Event",
              name,
              runtimeActions: overrides?.runtimeActions ?? [
                "my-package/action",
              ],
              ...(overrides?.env && { env: overrides.env }),
            },
          ],
          provider: {
            description: "External events",
            label: "External Provider",
          },
        },
      ],
    },
    metadata: minimalValidConfig.metadata,
  };
}

export function createConfigWithTwoCommerceEventingSources(options?: {
  firstSourceEnv?: CommerceEnv[];
}) {
  const [firstSource] = configWithCommerceEventing.eventing.commerce;
  const firstSourceEnv = options?.firstSourceEnv;
  const scopedFirstSource = firstSourceEnv
    ? {
        ...firstSource,
        events: firstSource.events.map((event) => ({
          ...event,
          env: firstSourceEnv,
        })),
      }
    : firstSource;

  return {
    ...configWithCommerceEventing,
    eventing: {
      commerce: [
        scopedFirstSource,
        {
          events: [
            {
              description: "Triggered when an order is cancelled",
              fields: [{ name: "order_id" }],
              label: "Order Cancelled",
              name: "plugin.order_cancelled",
              runtimeActions: ["my-package/handle-order-cancelled"],
            },
          ],
          provider: {
            description: "Provides additional commerce events",
            label: "Second Commerce Events Provider",
          },
        },
      ],
    },
  } satisfies CommerceAppConfigOutputModel;
}

/** Config fixture with only order adminUi grid columns configured. */
export const configWithAdminUiSingleGrid = {
  adminUi: {
    order: {
      gridColumns: {
        columns: [
          {
            align: "left" as const,
            id: "fulfillment_status",
            label: "Fulfillment",
            type: "string" as const,
          },
        ],
        description: "Adds fulfillment status to the order grid",
        label: "Order fulfillment data",
        runtimeAction: "orders/fetch-order-grid-data",
      },
    },
  },
  metadata: { ...mockMetadata, id: "test-app-admin-ui-single-grid" },
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with grid columns configured for all three entities (order, product, customer). */
export const configWithAdminUiAllGrids = {
  adminUi: {
    customer: {
      gridColumns: {
        columns: [
          {
            align: "left" as const,
            id: "loyalty_tier",
            label: "Loyalty Tier",
            type: "string" as const,
          },
        ],
        description: "Adds loyalty tier to the customer grid",
        label: "Customer loyalty data",
        runtimeAction: "customers/fetch-customer-grid-data",
      },
    },
    order: {
      gridColumns: {
        columns: [
          {
            align: "left" as const,
            id: "fulfillment_status",
            label: "Fulfillment",
            type: "string" as const,
          },
        ],
        description: "Adds fulfillment status to the order grid",
        label: "Order fulfillment data",
        runtimeAction: "orders/fetch-order-grid-data",
      },
    },
    product: {
      gridColumns: {
        columns: [
          {
            align: "left" as const,
            id: "inventory_status",
            label: "Inventory",
            type: "string" as const,
          },
        ],
        description: "Adds inventory status to the product grid",
        label: "Product inventory data",
        runtimeAction: "products/fetch-product-grid-data",
      },
    },
  },
  metadata: { ...mockMetadata, id: "test-app-admin-ui-all-grids" },
} satisfies CommerceAppConfigOutputModel;

/** Minimal valid adminUi menu object (required fields only). */
const adminUiMenuMinimalPart = {
  description: "Review and approve purchase requests from Commerce Admin.",
  id: "approval_dashboard",
  label: "Approval Dashboard",
} satisfies NonNullable<CommerceAppConfigOutputModel["adminUi"]>["menu"];

/** Full adminUi menu object with all fields populated. */
const adminUiMenuPart = {
  ...adminUiMenuMinimalPart,
  parentMenu: "sales",
  sandboxPermissions: ["allow-popups", "allow-downloads"] as const,
} satisfies NonNullable<CommerceAppConfigOutputModel["adminUi"]>["menu"];

/** Config fixture with an adminUi menu declaration (no grid columns). */
export const configWithAdminUiMenu = {
  adminUi: {
    menu: adminUiMenuPart,
  },
  metadata: { ...mockMetadata, id: "test-app-admin-ui-menu" },
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with only worker mass actions configured (no view mass actions, no grids). */
export const configWithWorkerMassActions = {
  adminUi: {
    customer: {
      massActions: [
        {
          id: "export-customers",
          label: "Export Customers",
          runtimeAction: "customers/export-customers",
          type: "worker" as const,
        },
      ],
    },
  },
  metadata: { ...mockMetadata, id: "test-app-worker-mass-actions" },
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with worker mass actions on two different entities with distinct runtimeActions. */
export const configWithMultipleWorkerMassActions = {
  adminUi: {
    customer: {
      massActions: [
        {
          id: "export-customers",
          label: "Export Customers",
          runtimeAction: "customers/export-customers",
          type: "worker" as const,
        },
      ],
    },
    order: {
      massActions: [
        {
          id: "export-orders",
          label: "Export Orders",
          runtimeAction: "orders/export-orders",
          type: "worker" as const,
        },
      ],
    },
  },
  metadata: { ...mockMetadata, id: "test-app-multiple-worker-mass-actions" },
} satisfies CommerceAppConfigOutputModel;

/** v2 Admin UI config fixture with view mass actions and no worker. */
export const configWithViewMassActions = {
  adminUi: {
    customer: {
      massActions: [
        {
          id: "customer-mass-action",
          label: "Customer Mass Action",
          path: "#/customer-mass-action",
          type: "view" as const,
        },
      ],
    },
    order: {
      massActions: [
        {
          confirm: { message: "Are you sure?", title: "Confirm" },
          description: "Adds a bulk order action.",
          id: "order-mass-action",
          label: "Order Mass Action",
          notifications: { success: "Done!" },
          path: "#/order-mass-action",
          selectionLimit: 1,
          type: "view" as const,
        },
      ],
    },
    product: {
      massActions: [
        {
          id: "product-mass-action",
          label: "Product Mass Action",
          path: "#/product-mass-action",
          type: "view" as const,
        },
      ],
    },
  },
  metadata: { ...mockMetadata, id: "test-app-admin-ui-sdk-v2" },
} satisfies CommerceAppConfigOutputModel;

/** Full v2 Admin UI config fixture covering all extension points including a worker mass action. */
export const configWithFullAdminUiV2 = {
  adminUi: {
    customer: {
      massActions: [
        {
          description: "Exports selected customers.",
          id: "export-customers",
          label: "Customer Mass Action",
          notifications: {
            error: "Export failed!",
            success: "Export complete!",
          },
          runtimeAction: "customers/export-customers",
          selectionLimit: 1,
          timeout: 30,
          type: "worker" as const,
        },
      ],
    },
    menu: adminUiMenuPart,
    order: {
      gridColumns: {
        columns: [
          {
            align: "left" as const,
            id: "poc_status",
            label: "PoC Status",
            type: "string" as const,
          },
        ],
        description: "Adds fulfillment status to the order grid",
        label: "Order fulfillment data",
        runtimeAction: "orders/fetch-order-data",
      },
      massActions: [
        {
          confirm: { message: "Are you sure?", title: "Confirm" },
          description: "Registers an order bulk action.",
          id: "order-mass-action",
          label: "Order Mass Action",
          notifications: { error: "Failed!", success: "Done!" },
          path: "#/order-mass-action",
          selectionLimit: 1,
          type: "view" as const,
        },
      ],
    },
    product: {
      massActions: [
        {
          id: "product-mass-action",
          label: "Product Mass Action",
          path: "#/mass-action",
          selectionLimit: 1,
          type: "view" as const,
        },
      ],
    },
  },
  metadata: { ...mockMetadata, id: "test-app-full-admin-ui-sdk-v2" },
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with order view buttons of type "view". */
export const configWithOrderViewTypeButtons = {
  adminUi: {
    order: {
      viewButtons: [
        {
          id: "delete-order",
          label: "Delete",
          path: "#/delete-order",
          type: "view" as const,
        },
      ],
    },
  },
  metadata: { ...mockMetadata, id: "test-app-view-buttons-view" },
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with order view buttons of type "worker". */
export const configWithOrderWorkerTypeButtons = {
  adminUi: {
    order: {
      viewButtons: [
        {
          id: "sync-inventory",
          label: "Sync inventory",
          runtimeAction: "orders/sync-inventory",
          type: "worker" as const,
        },
      ],
    },
  },
  metadata: { ...mockMetadata, id: "test-app-view-buttons-worker" },
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with both view and worker order view buttons. */
export const configWithOrderViewButtons = {
  adminUi: {
    order: {
      viewButtons: [
        {
          id: "delete-order",
          label: "Delete",
          path: "#/delete-order",
          type: "view" as const,
        },
        {
          id: "sync-inventory",
          label: "Sync inventory",
          runtimeAction: "orders/sync-inventory",
          type: "worker" as const,
        },
      ],
    },
  },
  metadata: { ...mockMetadata, id: "test-app-view-buttons-mixed" },
} satisfies CommerceAppConfigOutputModel;

/** Config fixture with dynamic business config list options. */
export const configWithDynamicListOptions = {
  businessConfig: { schema: schemaWithDynamicListOptions },
  metadata: { ...mockMetadata, id: "dynamic-list-options-app" },
} satisfies CommerceAppConfigOutputModel;
