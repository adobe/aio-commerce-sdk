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

import { nonEmptyStringValueSchema } from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

import type { CommerceAppConfigOutputModel } from "./app";

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
  key: nonEmptyStringValueSchema("column key"),
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

const AdminUiOrderSchema = v.object({
  gridColumns: v.optional(GridColumnsSchema),
});

const AdminUiProductSchema = v.object({
  gridColumns: v.optional(GridColumnsSchema),
});

const AdminUiCustomerSchema = v.object({
  gridColumns: v.optional(GridColumnsSchema),
});

/**
 * Schema for the `adminUi` config section (grid column extensions on `commerce/backend-ui/2`).
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

/** Config type when `adminUi` grid column configuration is present. */
export type AdminUiConfig = CommerceAppConfigOutputModel & {
  adminUi: NonNullable<CommerceAppConfigOutputModel["adminUi"]>;
};

/**
 * Check if config has Admin UI grid column configuration.
 * @experimental
 */
export function hasAdminUi(
  config: CommerceAppConfigOutputModel,
): config is AdminUiConfig {
  return config.adminUi !== undefined;
}
