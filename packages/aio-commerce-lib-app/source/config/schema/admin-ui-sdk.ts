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

import type { AdminUiSdkConfig } from "#management/installation/admin-ui-sdk/utils";
import type { CommerceAppConfigOutputModel } from "./app";

const SANDBOX_VALUES = [
  "allow-downloads",
  "allow-modals",
  "allow-popups",
] as const;

const SandboxSchema = v.pipe(
  v.string('Expected a string value for "sandbox"'),
  v.check(
    (val) =>
      val
        .split(" ")
        .every((value) =>
          (SANDBOX_VALUES as readonly string[]).includes(value),
        ),
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

const massActionBaseEntries = {
  actionId: nonEmptyStringValueSchema("mass action ID"),
  label: nonEmptyStringValueSchema("mass action label"),
  title: v.optional(nonEmptyStringValueSchema("mass action page title")),
  confirm: v.optional(MassActionConfirmSchema),
  path: nonEmptyStringValueSchema("mass action path"),
  ...iframeActionEntries,
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

type SchemaEntries = Record<
  string,
  v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>
>;

function createMassActionSchema<TEntries extends SchemaEntries>(
  variantEntries: TEntries,
) {
  return withSandboxDisplayIframeCheck(
    v.strictObject({
      ...massActionBaseEntries,
      ...variantEntries,
    }),
  );
}

const OrderMassActionSchema = createMassActionSchema({
  selectionLimit: v.optional(positiveNumberValueSchema("selectionLimit")),
});

const ProductMassActionSchema = createMassActionSchema({
  productSelectLimit: v.optional(
    positiveNumberValueSchema("productSelectLimit"),
  ),
});

const CustomerMassActionSchema = createMassActionSchema({
  customerSelectLimit: v.optional(
    positiveNumberValueSchema("customerSelectLimit"),
  ),
});

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
  massActions: v.optional(v.array(OrderMassActionSchema)),
  gridColumns: v.optional(GridColumnsSchema),
  viewButtons: v.optional(v.array(OrderViewButtonSchema)),
  customFees: v.optional(v.array(CustomFeeSchema)),
});

const ProductExtensionPointsSchema = v.object({
  massActions: v.optional(v.array(ProductMassActionSchema)),
  gridColumns: v.optional(GridColumnsSchema),
});

const CustomerExtensionPointsSchema = v.object({
  massActions: v.optional(v.array(CustomerMassActionSchema)),
  gridColumns: v.optional(GridColumnsSchema),
});

const MassActionBannerSchema = v.object({
  actionId: nonEmptyStringValueSchema("mass action ID"),
  successMessage: v.optional(nonEmptyStringValueSchema("success message")),
  errorMessage: v.optional(nonEmptyStringValueSchema("error message")),
});

const OrderViewButtonBannerSchema = v.object({
  buttonId: nonEmptyStringValueSchema("view button ID"),
  successMessage: v.optional(nonEmptyStringValueSchema("success message")),
  errorMessage: v.optional(nonEmptyStringValueSchema("error message")),
});

const BannerNotificationSchema = v.object({
  massActions: v.optional(
    v.object({
      order: v.optional(v.array(MassActionBannerSchema)),
      product: v.optional(v.array(MassActionBannerSchema)),
      customer: v.optional(v.array(MassActionBannerSchema)),
    }),
  ),
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
 * Schema for the Admin UI SDK registration parameters (for the `adminUiSdk.registration` config section).
 * @see https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/extension-points/ for more details.
 */
const AdminUiSdkRegistrationSchema = v.object({
  menuItems: v.optional(v.array(MenuItemSchema)),
  order: v.optional(OrderExtensionPointsSchema),
  product: v.optional(ProductExtensionPointsSchema),
  customer: v.optional(CustomerExtensionPointsSchema),
  bannerNotification: v.optional(BannerNotificationSchema),
});

/** Schema for Admin UI SDK configuration. */
export const AdminUiSdkSchema = v.object({
  registration: AdminUiSdkRegistrationSchema,
});

/** The Admin UI SDK configuration for an Adobe Commerce application. */
export type AdminUiSdkConfiguration = v.InferInput<typeof AdminUiSdkSchema>;

/** The Admin UI SDK registration configuration. */
export type AdminUiSdkRegistration = v.InferInput<
  typeof AdminUiSdkRegistrationSchema
>;

/** An order mass action registration entry (uses `selectionLimit`). */
export type OrderMassAction = v.InferInput<typeof OrderMassActionSchema>;

/** A product mass action registration entry (uses `productSelectLimit`). */
export type ProductMassAction = v.InferInput<typeof ProductMassActionSchema>;

/** A customer mass action registration entry (uses `customerSelectLimit`). */
export type CustomerMassAction = v.InferInput<typeof CustomerMassActionSchema>;

/** An order view button registration entry. */
export type OrderViewButton = v.InferInput<typeof OrderViewButtonSchema>;

/** A custom fee registration entry. */
export type CustomFee = v.InferInput<typeof CustomFeeSchema>;

/** Grid columns registration configuration. */
export type GridColumns = v.InferInput<typeof GridColumnsSchema>;

/** Banner notification registration configuration. */
export type BannerNotification = v.InferInput<typeof BannerNotificationSchema>;

/** A menu item registration entry. */
export type MenuItem = v.InferInput<typeof MenuItemSchema>;

/** Check if config has Admin UI SDK registration configuration. */
export function hasAdminUiSdk(
  config: CommerceAppConfigOutputModel,
): config is AdminUiSdkConfig {
  return (
    config.adminUiSdk !== undefined &&
    config.adminUiSdk.registration !== undefined
  );
}
