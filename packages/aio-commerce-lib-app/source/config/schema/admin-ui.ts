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
  nonEmptyStringValueSchema,
  positiveNumberValueSchema,
} from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

import {
  CustomFeeSchema,
  GridColumnsSchema,
  MassActionConfirmSchema,
  OrderViewButtonBannerSchema,
  OrderViewButtonSchema,
  SandboxSchema,
} from "./admin-ui-sdk";

import type { AnyCommerceAppConfig, CommerceAppConfigOutputModel } from "./app";

const MassActionNotificationsSchema = v.object({
  success: v.optional(nonEmptyStringValueSchema("notifications.success")),
  error: v.optional(nonEmptyStringValueSchema("notifications.error")),
});

/** Fields shared by both v2 mass-action variants. `description` is flat — no `installation` nesting. */
const massActionCommonEntriesV2 = {
  id: nonEmptyStringValueSchema("mass action ID"),
  label: nonEmptyStringValueSchema("mass action label"),
  description: v.optional(nonEmptyStringValueSchema("mass action description")),
  title: v.optional(nonEmptyStringValueSchema("mass action page title")),
  confirm: v.optional(MassActionConfirmSchema),
  notifications: v.optional(MassActionNotificationsSchema),
  selectionLimit: v.optional(positiveNumberValueSchema("selectionLimit")),
};

/** `type: "view"` mass action — renders an iframe at `path`. */
const ViewMassActionSchema = v.strictObject({
  ...massActionCommonEntriesV2,
  type: v.literal("view"),
  path: nonEmptyStringValueSchema("mass action path"),
  sandboxPermissions: v.optional(SandboxSchema),
});

/** `type: "worker"` mass action — invokes a workerProcess runtime action. */
const WorkerMassActionSchema = v.strictObject({
  ...massActionCommonEntriesV2,
  type: v.literal("worker"),
  runtimeAction: nonEmptyStringValueSchema("runtimeAction"),
  timeout: v.optional(positiveNumberValueSchema("timeout")),
});

/**
 * A v2 mass action entry. Discriminated by `type`: `"view"` renders an iframe;
 * `"worker"` invokes a runtime action.
 */
const MassActionSchema = v.variant(
  "type",
  [ViewMassActionSchema, WorkerMassActionSchema],
  'mass action "type" must be either "view" or "worker"',
);

const OrderExtensionPointsSchemaV2 = v.object({
  massActions: v.optional(v.array(MassActionSchema)),
  gridColumns: v.optional(GridColumnsSchema),
  viewButtons: v.optional(v.array(OrderViewButtonSchema)),
  customFees: v.optional(v.array(CustomFeeSchema)),
});

const ProductExtensionPointsSchemaV2 = v.object({
  massActions: v.optional(v.array(MassActionSchema)),
  gridColumns: v.optional(GridColumnsSchema),
});

const CustomerExtensionPointsSchemaV2 = v.object({
  massActions: v.optional(v.array(MassActionSchema)),
  gridColumns: v.optional(GridColumnsSchema),
});

const BannerNotificationSchemaV2 = v.object({
  orderViewButtons: v.optional(v.array(OrderViewButtonBannerSchema)),
});

/**
 * Schema for the v2 Admin UI configuration (the `adminUi` config section).
 * No `registration` wrapper — entities live directly under `adminUi`.
 * @experimental
 */
export const AdminUiSchema = v.object({
  order: v.optional(OrderExtensionPointsSchemaV2),
  product: v.optional(ProductExtensionPointsSchemaV2),
  customer: v.optional(CustomerExtensionPointsSchemaV2),
  bannerNotification: v.optional(BannerNotificationSchemaV2),
});

/**
 * The v2 Admin UI configuration for an Adobe Commerce application.
 * @experimental
 */
export type AdminUiConfiguration = v.InferInput<typeof AdminUiSchema>;

/**
 * A v2 mass action registration entry (view or worker variant).
 * @experimental
 */
export type MassAction = v.InferInput<typeof MassActionSchema>;

/**
 * A view-type v2 mass action.
 * @experimental
 */
export type ViewMassAction = v.InferInput<typeof ViewMassActionSchema>;

/**
 * A worker-type v2 mass action.
 * @experimental
 */
export type WorkerMassAction = v.InferInput<typeof WorkerMassActionSchema>;

/** Config type when v2 Admin UI configuration is present. */
export type AppConfigWithAdminUi<
  T extends AnyCommerceAppConfig = CommerceAppConfigOutputModel,
> = T & { adminUi: NonNullable<T["adminUi"]> };

/**
 * Check if config has v2 Admin UI configuration.
 * @experimental
 */
export function hasAdminUi<T extends AnyCommerceAppConfig>(
  config: T,
): config is T & AppConfigWithAdminUi<T> {
  return config.adminUi !== undefined;
}
