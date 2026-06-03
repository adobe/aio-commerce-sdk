/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {
  booleanValueSchema,
  nonEmptyStringValueSchema,
  positiveNumberValueSchema,
} from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

import type { AnyCommerceAppConfig, CommerceAppConfigOutputModel } from "./app";

const SANDBOX_VALUES = [
  "allow-downloads",
  "allow-modals",
  "allow-popups",
] as const satisfies string[];

type SandboxValue = (typeof SANDBOX_VALUES)[number];

function isSandboxValue(value: string): value is SandboxValue {
  return SANDBOX_VALUES.includes(value as SandboxValue);
}

const SandboxSchema = v.pipe(
  v.string('Expected a string value for "sandbox"'),
  v.check(
    (val) => val.split(" ").every(isSandboxValue),
    `sandbox must contain only single-space-separated values from: ${SANDBOX_VALUES.map((t) => `"${t}"`).join(", ")}`,
  ),
);

const ColumnTypeSchema = v.picklist([
  "boolean",
  "date",
  "float",
  "integer",
  "string",
]);
const ColumnAlignSchema = v.picklist(["left", "right", "center"]);
const ViewButtonLevelSchema = v.picklist([-1, 0, 1]);

const MassActionConfirmSchema = v.object({
  title: v.optional(nonEmptyStringValueSchema("confirm title")),
  message: v.optional(nonEmptyStringValueSchema("confirm message")),
});

const ViewButtonConfirmSchema = v.object({
  message: v.optional(nonEmptyStringValueSchema("confirm message")),
});

const iframeActionEntries = {
  displayIframe: v.optional(booleanValueSchema("displayIframe")),
  timeout: v.optional(positiveNumberValueSchema("timeout")),
  sandbox: v.optional(SandboxSchema),
};

const SANDBOX_DISPLAY_IFRAME_MESSAGE =
  "sandbox is only relevant when displayIframe is set to true";

type SandboxDisplayIframeInput = {
  sandbox?: string | undefined;
  displayIframe?: boolean | undefined;
};

// Defined once with a concrete input type; cast inside withSandboxDisplayIframeCheck
// to the actual schema output type (safe because every schema using this has both fields).
const sandboxDisplayIframeCheck = v.forward(
  v.partialCheck<
    SandboxDisplayIframeInput,
    readonly [readonly ["sandbox"], readonly ["displayIframe"]],
    SandboxDisplayIframeInput,
    typeof SANDBOX_DISPLAY_IFRAME_MESSAGE
  >(
    [["sandbox"], ["displayIframe"]],
    (input) => input.sandbox === undefined || input.displayIframe === true,
    SANDBOX_DISPLAY_IFRAME_MESSAGE,
  ),
  ["sandbox"],
);

// TODO: Cleanup after https://github.com/open-circle/valibot/issues/1459
function withSandboxDisplayIframeCheck<
  TSchema extends v.BaseSchema<
    unknown,
    SandboxDisplayIframeInput,
    v.BaseIssue<unknown>
  >,
>(schema: TSchema) {
  return v.pipe(
    schema,
    // Cast is required: valibot's "~types" property is invariant, so a shared action
    // constant cannot be assigned to PipeItem<FullSchemaOutput> without this cast.
    // Runtime behavior is identical to inlining the check in each schema.
    sandboxDisplayIframeCheck as unknown as v.BaseValidation<
      v.InferOutput<TSchema>,
      v.InferOutput<TSchema>,
      v.BaseIssue<unknown>
    >,
  );
}

const GridColumnPropertySchema = v.object({
  label: nonEmptyStringValueSchema("column label"),
  columnId: nonEmptyStringValueSchema("column ID"),
  type: ColumnTypeSchema,
  align: ColumnAlignSchema,
});

const GridColumnsSchema = v.object({
  data: v.object({
    meshId: nonEmptyStringValueSchema("mesh ID"),
  }),
  properties: v.pipe(
    v.array(GridColumnPropertySchema),
    v.minLength(1, "At least one grid column property is required"),
  ),
});

const MassActionNotificationsSchema = v.object({
  success: v.optional(nonEmptyStringValueSchema("notifications.success")),
  error: v.optional(nonEmptyStringValueSchema("notifications.error")),
});

const MassActionInstallationSchema = v.object({
  label: nonEmptyStringValueSchema("installation label"),
  description: v.optional(
    nonEmptyStringValueSchema("installation description"),
  ),
});

/** Fields shared by both mass-action variants. */
const massActionCommonEntries = {
  actionId: nonEmptyStringValueSchema("mass action actionId"),
  label: nonEmptyStringValueSchema("mass action label"),
  title: v.optional(nonEmptyStringValueSchema("mass action page title")),
  confirm: v.optional(MassActionConfirmSchema),
  notifications: v.optional(MassActionNotificationsSchema),
  installation: v.optional(MassActionInstallationSchema),
  selectionLimit: v.optional(positiveNumberValueSchema("selectionLimit")),
};

/** `type: "view"` mass action — renders an iframe at `path`. */
const ViewMassActionSchema = v.strictObject({
  ...massActionCommonEntries,
  type: v.literal("view"),
  path: nonEmptyStringValueSchema("mass action path"),
  sandbox: v.optional(SandboxSchema),
});

/** `type: "worker"` mass action — invokes a workerProcess runtime action. */
const WorkerMassActionSchema = v.strictObject({
  ...massActionCommonEntries,
  type: v.literal("worker"),
  runtimeAction: nonEmptyStringValueSchema("runtimeAction"),
  timeout: v.optional(positiveNumberValueSchema("timeout")),
});

/**
 * A mass action registration entry. Discriminated by `type`: `"view"` renders an
 * iframe (`path`, optional `sandbox`); `"worker"` invokes a runtime action
 * (`runtimeAction`, optional `timeout`).
 */
const MassActionSchema = v.variant(
  "type",
  [ViewMassActionSchema, WorkerMassActionSchema],
  'mass action "type" must be either "view" or "worker"',
);

const OrderViewButtonSchema = withSandboxDisplayIframeCheck(
  v.object({
    buttonId: nonEmptyStringValueSchema("view button ID"),
    label: nonEmptyStringValueSchema("view button label"),
    confirm: v.optional(ViewButtonConfirmSchema),
    path: nonEmptyStringValueSchema("view button path"),
    level: v.optional(ViewButtonLevelSchema),
    sortOrder: v.optional(positiveNumberValueSchema("sortOrder")),
    ...iframeActionEntries,
  }),
);

const CustomFeeSchema = v.object({
  id: nonEmptyStringValueSchema("custom fee ID"),
  label: nonEmptyStringValueSchema("custom fee label"),
  value: v.number("Custom fee value must be a number"),
  orderMinimumAmount: v.optional(
    v.number("orderMinimumAmount must be a number"),
  ),
  applyFeeOnLastInvoice: v.optional(
    booleanValueSchema("applyFeeOnLastInvoice"),
  ),
  applyFeeOnLastCreditMemo: v.optional(
    booleanValueSchema("applyFeeOnLastCreditMemo"),
  ),
});

const OrderExtensionPointsSchema = v.object({
  massActions: v.optional(v.array(MassActionSchema)),
  gridColumns: v.optional(GridColumnsSchema),
  viewButtons: v.optional(v.array(OrderViewButtonSchema)),
  customFees: v.optional(v.array(CustomFeeSchema)),
});

const ProductExtensionPointsSchema = v.object({
  massActions: v.optional(v.array(MassActionSchema)),
  gridColumns: v.optional(GridColumnsSchema),
});

const CustomerExtensionPointsSchema = v.object({
  massActions: v.optional(v.array(MassActionSchema)),
  gridColumns: v.optional(GridColumnsSchema),
});

const OrderViewButtonBannerSchema = v.object({
  buttonId: nonEmptyStringValueSchema("view button ID"),
  successMessage: v.optional(nonEmptyStringValueSchema("success message")),
  errorMessage: v.optional(nonEmptyStringValueSchema("error message")),
});

const BannerNotificationSchema = v.object({
  orderViewButtons: v.optional(v.array(OrderViewButtonBannerSchema)),
});

const MenuItemSchema = v.object({
  id: nonEmptyStringValueSchema("menu item ID"),
  title: v.optional(nonEmptyStringValueSchema("menu item title")),
  parent: v.optional(nonEmptyStringValueSchema("menu item parent")),
  sortOrder: v.optional(v.number()),
  isSection: v.optional(booleanValueSchema("isSection")),
  sandbox: v.optional(SandboxSchema),
});

/**
 * Schema for the Admin UI SDK configuration (the `adminUi` config section).
 * @see https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/extension-points/ for more details.
 */
export const AdminUiSchema = v.object({
  menuItems: v.optional(v.array(MenuItemSchema)),
  order: v.optional(OrderExtensionPointsSchema),
  product: v.optional(ProductExtensionPointsSchema),
  customer: v.optional(CustomerExtensionPointsSchema),
  bannerNotification: v.optional(BannerNotificationSchema),
});

/**
 * The Admin UI configuration for an Adobe Commerce application.
 * @experimental
 */
export type AdminUiConfiguration = v.InferInput<typeof AdminUiSchema>;

/**
 * A mass action registration entry (view or worker variant).
 * @experimental
 */
export type MassAction = v.InferInput<typeof MassActionSchema>;

/**
 * A view-type mass action.
 * @experimental
 */
export type ViewMassAction = v.InferInput<typeof ViewMassActionSchema>;

/**
 * A worker-type mass action.
 * @experimental
 */
export type WorkerMassAction = v.InferInput<typeof WorkerMassActionSchema>;

/**
 * An order view button registration entry.
 * @experimental
 */
export type OrderViewButton = v.InferInput<typeof OrderViewButtonSchema>;

/**
 * A custom fee registration entry.
 * @experimental
 */
export type CustomFee = v.InferInput<typeof CustomFeeSchema>;

/**
 * Grid columns registration configuration.
 * @experimental
 */
export type GridColumns = v.InferInput<typeof GridColumnsSchema>;

/**
 * Banner notification registration configuration.
 * @experimental
 */
export type BannerNotification = v.InferInput<typeof BannerNotificationSchema>;

/**
 * A menu item registration entry.
 * @experimental
 */
export type MenuItem = v.InferInput<typeof MenuItemSchema>;

/** Config type when Admin UI configuration is present. */
export type AppConfigWithAdminUi<
  T extends AnyCommerceAppConfig = CommerceAppConfigOutputModel,
> = T & { adminUi: NonNullable<T["adminUi"]> };

/**
 * Check if config has Admin UI configuration.
 * @experimental
 */
export function hasAdminUi<T extends AnyCommerceAppConfig>(
  config: T,
): config is T & AppConfigWithAdminUi<T> {
  return config.adminUi !== undefined;
}
