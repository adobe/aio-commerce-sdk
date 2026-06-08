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

import type { AnyCommerceAppConfig, CommerceAppConfigOutputModel } from "./app";

const ColumnTypeSchema = v.picklist([
  "boolean",
  "date",
  "datetime",
  "decimal",
  "integer",
  "string",
]);

const ColumnAlignSchema = v.picklist(["left", "right", "center"]);

const GridColumnSchema = v.object({
  id: nonEmptyStringValueSchema("column ID"),
  label: nonEmptyStringValueSchema("column label"),
  type: ColumnTypeSchema,
  align: ColumnAlignSchema,
});

const GridColumnsSchema = v.object({
  label: nonEmptyStringValueSchema("grid columns label"),
  description: nonEmptyStringValueSchema("grid columns description"),
  runtimeAction: nonEmptyStringValueSchema("runtime action"),
  columns: v.pipe(
    v.array(GridColumnSchema),
    v.minLength(1, "At least one grid column is required"),
  ),
});

const ViewButtonLevelSchema = v.picklist([-1, 0, 1]);

const ViewButtonConfirmSchema = v.object({
  message: v.optional(nonEmptyStringValueSchema("confirm message")),
});

const NotificationsSchema = v.object({
  success: v.optional(nonEmptyStringValueSchema("success notification")),
  error: v.optional(nonEmptyStringValueSchema("error notification")),
});

const SandboxPermissionSchema = v.picklist([
  "allow-downloads",
  "allow-modals",
  "allow-popups",
]);

const OrderViewButtonSchema = v.variant("type", [
  v.strictObject({
    type: v.literal("view"),
    id: nonEmptyStringValueSchema("view button ID"),
    label: nonEmptyStringValueSchema("view button label"),
    description: v.optional(
      nonEmptyStringValueSchema("view button description"),
    ),
    path: nonEmptyStringValueSchema("view button path"),
    level: v.optional(ViewButtonLevelSchema),
    sortOrder: v.optional(positiveNumberValueSchema("sortOrder")),
    confirm: v.optional(ViewButtonConfirmSchema),
    sandboxPermissions: v.optional(v.array(SandboxPermissionSchema)),
    notifications: v.optional(NotificationsSchema),
  }),
  v.strictObject({
    type: v.literal("worker"),
    id: nonEmptyStringValueSchema("view button ID"),
    label: nonEmptyStringValueSchema("view button label"),
    description: v.optional(
      nonEmptyStringValueSchema("view button description"),
    ),
    runtimeAction: nonEmptyStringValueSchema("runtime action"),
    level: v.optional(ViewButtonLevelSchema),
    sortOrder: v.optional(positiveNumberValueSchema("sortOrder")),
    confirm: v.optional(ViewButtonConfirmSchema),
    timeout: v.optional(positiveNumberValueSchema("timeout")),
    notifications: v.optional(NotificationsSchema),
  }),
]);

const AdminUiOrderSchema = v.object({
  gridColumns: v.optional(GridColumnsSchema),
  viewButtons: v.optional(v.array(OrderViewButtonSchema)),
});

const AdminUiProductSchema = v.object({
  gridColumns: v.optional(GridColumnsSchema),
});

const AdminUiCustomerSchema = v.object({
  gridColumns: v.optional(GridColumnsSchema),
});

/**
 * Schema for the `adminUi` config section (grid column extensions and order view buttons on `commerce/backend-ui/2`).
 * @experimental
 */
export const AdminUiSchema = v.object({
  order: v.optional(AdminUiOrderSchema),
  product: v.optional(AdminUiProductSchema),
  customer: v.optional(AdminUiCustomerSchema),
});

/**
 * The Admin UI configuration for an Adobe Commerce application.
 * @experimental
 */
export type AdminUiConfiguration = v.InferInput<typeof AdminUiSchema>;

/**
 * Grid columns registration configuration.
 * @experimental
 */
export type GridColumns = v.InferInput<typeof GridColumnsSchema>;

/**
 * A single grid column definition.
 * @experimental
 */
export type GridColumn = v.InferInput<typeof GridColumnSchema>;

/**
 * An order view button registration entry (v2, `adminUi`).
 * @experimental
 */
export type OrderViewButton = v.InferInput<typeof OrderViewButtonSchema>;

/**
 * Inlined notification strings on an `adminUi` registration entry.
 * @experimental
 */
export type Notifications = v.InferInput<typeof NotificationsSchema>;

/** Config type when `adminUi` configuration is present. */
export type AdminUiConfig<
  T extends AnyCommerceAppConfig = CommerceAppConfigOutputModel,
> = T & {
  adminUi: NonNullable<T["adminUi"]>;
};

/**
 * Check if config has Admin UI configuration.
 * @experimental
 */
export function hasAdminUi<T extends AnyCommerceAppConfig>(
  config: T,
): config is AdminUiConfig<T> {
  return config.adminUi !== undefined;
}
