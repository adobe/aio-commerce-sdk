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

import type { AdminUi, AdminUiComponentConfig } from "#config/schema/admin-ui";
import type { DomainPlan } from "#management/common/workflow/resource";

/** The Commerce entity an Admin UI component attaches to (absent for the menu and acl). */
export type AdminUiComponentEntity = Exclude<keyof AdminUi, "menu" | "acl">;

/**
 * The addressable kinds of Admin UI component an upgrade operation can target,
 * derived from the schema's component field names.
 */
export type AdminUiComponentKind =
  | "acl"
  | "menu"
  | keyof NonNullable<AdminUi["order"]>;

/** Locates a single Admin UI component within the `adminUi` block. */
export type AdminUiComponentRef = {
  kind: AdminUiComponentKind;

  /** The entity the component attaches to; absent for the top-level menu. */
  entity?: AdminUiComponentEntity;

  /** Item id for array-based components (mass actions, view buttons). */
  id?: string;
};

/** The value an Admin UI operation carries: which component changed, and its config. */
export type AdminUiOperationValue = {
  component: AdminUiComponentRef;
  config: AdminUiComponentConfig;
};

/**
 * The single whole-extension action `apply` performs to converge a plan's
 * component operations. Commerce exposes no per-component API, so the granular
 * adds and removes collapse to one call: `register` (first-time), `refresh`
 * (re-sync an existing extension), or `unregister` (drop it).
 */
export type AdminUiExtensionAction = "refresh" | "register" | "unregister";

/**
 * The plan the Admin UI domain proposes: a per-component add/remove list (for
 * review and auditing) plus the single {@link AdminUiExtensionAction} that
 * converges them.
 */
export type AdminUiDomainPlan = DomainPlan<AdminUiOperationValue> & {
  extensionAction: AdminUiExtensionAction | null;

  /** The `extensionId` from the baseline snapshot, or `null` when there is no baseline. */
  baselineExtensionId: string | null;
};
