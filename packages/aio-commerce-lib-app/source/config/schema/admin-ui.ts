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

import { COMMERCE_MENUS } from "@adobe/aio-commerce-lib-admin-ui/menu";
import {
  nonEmptyStringValueSchema,
  positiveNumberValueSchema,
} from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

import type { AnyCommerceAppConfig, CommerceAppConfigOutputModel } from "./app";

// ─── Shared ───────────────────────────────────────────────────────────────────

const SANDBOX_PERMISSION_VALUES = [
  "allow-downloads",
  "allow-modals",
  "allow-popups",
] as const satisfies string[];

const SandboxPermissionsSchema = v.pipe(
  v.array(
    v.picklist(
      SANDBOX_PERMISSION_VALUES,
      `Invalid sandbox permission. Accepted values are: ${SANDBOX_PERMISSION_VALUES.join(", ")}`,
    ),
  ),
  v.minLength(
    1,
    "sandboxPermissions must contain at least one permission when it's defined",
  ),
  v.check((permissions) => {
    const uniquePermissions = new Set(permissions);
    return uniquePermissions.size === permissions.length;
  }, "Duplicate permissions are not allowed in sandboxPermissions"),
);

const NotificationsSchema = v.object({
  success: v.optional(nonEmptyStringValueSchema("success notification")),
  error: v.optional(nonEmptyStringValueSchema("error notification")),
});

const ConfirmSchema = v.object({
  title: v.optional(nonEmptyStringValueSchema("confirm title")),
  message: v.optional(nonEmptyStringValueSchema("confirm message")),
});

// ─── Grid columns ─────────────────────────────────────────────────────────────

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

// ─── Mass actions ─────────────────────────────────────────────────────────────

/** Fields shared by both mass-action variants. `description` is flat — no `installation` nesting. */
const massActionCommonEntries = {
  id: nonEmptyStringValueSchema("mass action ID"),
  label: nonEmptyStringValueSchema("mass action label"),
  description: v.optional(nonEmptyStringValueSchema("mass action description")),
  title: v.optional(nonEmptyStringValueSchema("mass action page title")),
  confirm: v.optional(ConfirmSchema),
  notifications: v.optional(NotificationsSchema),
  selectionLimit: v.optional(positiveNumberValueSchema("selectionLimit")),
};

/** `type: "view"` mass action — renders an iframe at `path`. */
const ViewMassActionSchema = v.strictObject({
  ...massActionCommonEntries,
  type: v.literal("view"),
  path: nonEmptyStringValueSchema("mass action path"),
  sandboxPermissions: v.optional(SandboxPermissionsSchema),
});

/** `type: "worker"` mass action — invokes a workerProcess runtime action. */
const WorkerMassActionSchema = v.strictObject({
  ...massActionCommonEntries,
  type: v.literal("worker"),
  runtimeAction: nonEmptyStringValueSchema("runtimeAction"),
  timeout: v.optional(positiveNumberValueSchema("timeout")),
});

/**
 * A mass action entry discriminated by `type`: `"view"` renders an iframe;
 * `"worker"` invokes a runtime action.
 */
const MassActionSchema = v.variant(
  "type",
  [ViewMassActionSchema, WorkerMassActionSchema],
  'mass action "type" must be either "view" or "worker"',
);

// ─── Order view buttons ───────────────────────────────────────────────────────

const ViewButtonLevelSchema = v.picklist([-1, 0, 1]);

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
    confirm: v.optional(ConfirmSchema),
    sandboxPermissions: v.optional(SandboxPermissionsSchema),
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
    confirm: v.optional(ConfirmSchema),
    timeout: v.optional(positiveNumberValueSchema("timeout")),
    notifications: v.optional(NotificationsSchema),
  }),
]);

// ─── Entity extension points ──────────────────────────────────────────────────

const AdminUiOrderSchema = v.object({
  massActions: v.optional(v.array(MassActionSchema)),
  gridColumns: v.optional(GridColumnsSchema),
  viewButtons: v.optional(v.array(OrderViewButtonSchema)),
});

const AdminUiProductSchema = v.object({
  massActions: v.optional(v.array(MassActionSchema)),
  gridColumns: v.optional(GridColumnsSchema),
});

const AdminUiCustomerSchema = v.object({
  massActions: v.optional(v.array(MassActionSchema)),
  gridColumns: v.optional(GridColumnsSchema),
});

const MenuIdSchema = v.pipe(
  nonEmptyStringValueSchema("menu ID"),
  v.regex(
    /^[A-Za-z0-9_/:]+$/,
    'Menu ID may contain only letters, digits, "/", ":", and "_"',
  ),
);

const MenuSchema = v.object({
  id: MenuIdSchema,
  label: nonEmptyStringValueSchema("menu label"),
  description: nonEmptyStringValueSchema("menu description"),
  pageTitle: v.optional(nonEmptyStringValueSchema("menu page title")),
  parentMenu: v.optional(
    v.picklist(
      COMMERCE_MENUS,
      "parentMenu must be a known Commerce Admin menu ID",
    ),
  ),
  sandboxPermissions: v.optional(SandboxPermissionsSchema),
});

// ─── Top-level schema ─────────────────────────────────────────────────────────

/**
 * Schema for the `adminUi` config section.
 * Supports grid column extensions, mass actions, order view buttons, and menu on `commerce/backend-ui/2`.
 * @experimental
 */
export const AdminUiSchema = v.object({
  menu: v.optional(MenuSchema),
  order: v.optional(AdminUiOrderSchema),
  product: v.optional(AdminUiProductSchema),
  customer: v.optional(AdminUiCustomerSchema),
});

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * The Admin UI configuration for an Adobe Commerce application.
 * @experimental
 */
export type AdminUiConfiguration = v.InferInput<typeof AdminUiSchema>;

/**
 * The validated Admin UI configuration for an Adobe Commerce application.
 * @experimental
 */
export type AdminUi = v.InferOutput<typeof AdminUiSchema>;

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
 * An order view button registration entry (v2, `adminUi`).
 * @experimental
 */
export type OrderViewButton = v.InferInput<typeof OrderViewButtonSchema>;

/**
 * Inlined notification strings on an `adminUi` registration entry.
 * @experimental
 */
export type Notifications = v.InferInput<typeof NotificationsSchema>;

/**
 * Admin UI menu registration configuration.
 * @experimental
 */
export type Menu = v.InferInput<typeof MenuSchema>;

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
