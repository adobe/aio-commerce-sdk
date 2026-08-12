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

import type { AdminUi } from "#config/schema/admin-ui";
import type { DomainPlan } from "#management/common/workflow/resource";

/** Identity of the single Admin UI extension registered for this app. */
export type AdminUiIdentity = {
  extensionName: string;
  workspaceName: string;
};

/** Snapshot data persisted after a successful Admin UI registration or refresh. */
export type AdminUiSnapshotData = {
  extensionId: string;
};

/** The Commerce entity an Admin UI component attaches to (absent for the menu). */
export type AdminUiComponentEntity = "customer" | "order" | "product";

/** The addressable kinds of Admin UI component an upgrade operation can target. */
export type AdminUiComponentKind =
  | "grid-columns"
  | "mass-action"
  | "menu"
  | "view-button";

/** Locates a single Admin UI component within the `adminUi` block. */
export type AdminUiComponentRef = {
  kind: AdminUiComponentKind;

  /** The entity the component attaches to; absent for the top-level menu. */
  entity?: AdminUiComponentEntity;

  /** Item id for array-based components (mass actions, view buttons). */
  id?: string;
};

/** The `adminUi.order` shape — the superset entity (grid columns, mass actions, view buttons). */
type AdminUiOrderEntity = NonNullable<AdminUi["order"]>;

/** The config of a single Admin UI component, carried on an operation for review and auditing. */
export type AdminUiComponentConfig =
  | NonNullable<AdminUi["menu"]>
  | NonNullable<AdminUiOrderEntity["gridColumns"]>
  | NonNullable<AdminUiOrderEntity["massActions"]>[number]
  | NonNullable<AdminUiOrderEntity["viewButtons"]>[number];

/** The value an Admin UI operation carries: which component changed, and its config. */
export type AdminUiOperationValue = {
  component: AdminUiComponentRef;
  config: AdminUiComponentConfig;
};

/**
 * The single whole-extension action `apply` performs to converge a plan's
 * component operations. Commerce exposes no per-component API, so the granular
 * adds and removes collapse to one call: `register` (first-time), `refresh`
 * (re-sync an existing extension), or `unregister` (drop it). `null` is a no-op.
 */
export type AdminUiExtensionAction = "refresh" | "register" | "unregister";

/**
 * The plan the Admin UI domain proposes: a per-component add/remove list (for
 * review and auditing) plus the single {@link AdminUiExtensionAction} that
 * converges them.
 */
export type AdminUiDomainPlan = DomainPlan<
  AdminUiOperationValue,
  AdminUiIdentity
> & {
  extensionAction: AdminUiExtensionAction | null;
};
