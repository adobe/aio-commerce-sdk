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

import { stringify } from "safe-stable-stringify";

import { hasExtensionName } from "./helpers";

import type {
  AdminUi,
  AdminUiComponentConfig,
  AdminUiConfig,
} from "#config/schema/admin-ui";
import type {
  PlanningInput,
  PlanningResult,
  ResourceOperation,
} from "#management/common/workflow/resource";
import type { ValidationExecutionContext } from "#management/common/workflow/step";
import type { RegisterExtensionStepData } from "./branch";
import type {
  AdminUiComponentRef,
  AdminUiDomainPlan,
  AdminUiExtensionAction,
  AdminUiOperationValue,
} from "./types";
import type { AdminUiStepContext } from "./utils";

/** A single enumerated Admin UI component with its diff key and display label. */
type AdminUiComponentDescriptor = {
  key: string;
  ref: AdminUiComponentRef;
  config: AdminUiComponentConfig;
  label: string;
};

/** Entities that can carry Admin UI components, in a stable diff order. */
const ADMIN_UI_ENTITIES = ["order", "product", "customer"] as const;

/**
 * Enumerates the individual components declared in an `adminUi` block, keyed by a
 * stable identity so the baseline and target can be diffed component-by-component.
 * Array-based components (mass actions, view buttons) key on their `id`, which the
 * schema guarantees is unique within each array.
 */
function enumerateComponents(
  adminUi: AdminUi,
): Map<string, AdminUiComponentDescriptor> {
  const components = new Map<string, AdminUiComponentDescriptor>();

  if (adminUi.menu) {
    components.set("menu", {
      config: adminUi.menu,
      key: "menu",
      label: "menu",
      ref: { kind: "menu" },
    });
  }

  for (const entity of ADMIN_UI_ENTITIES) {
    const entityConfig = adminUi[entity];
    if (!entityConfig) {
      continue;
    }

    if (entityConfig.gridColumns) {
      const key = `${entity}.grid-columns`;
      components.set(key, {
        config: entityConfig.gridColumns,
        key,
        label: `${entity} grid columns`,
        ref: { entity, kind: "gridColumns" },
      });
    }

    for (const massAction of entityConfig.massActions ?? []) {
      const key = `${entity}.mass-action.${massAction.id}`;
      components.set(key, {
        config: massAction,
        key,
        label: `${entity} mass action "${massAction.id}"`,
        ref: { entity, id: massAction.id, kind: "massActions" },
      });
    }
  }

  for (const viewButton of adminUi.order?.viewButtons ?? []) {
    const key = `order.view-button.${viewButton.id}`;
    components.set(key, {
      config: viewButton,
      key,
      label: `order view button "${viewButton.id}"`,
      ref: { entity: "order", id: viewButton.id, kind: "viewButtons" },
    });
  }

  return components;
}

/** Reads the baseline's persisted `extensionId`, or `null` when there is no baseline. */
function extractBaselineExtensionId(
  baseline: { data: RegisterExtensionStepData | null } | null,
): string | null {
  return baseline?.data?.extensionId ?? null;
}

/** Builds an `add` or `remove` operation for a single enumerated component. */
function buildComponentOperation(
  kind: "add" | "remove",
  key: string,
  component: AdminUiComponentDescriptor,
): ResourceOperation<AdminUiOperationValue> {
  const value: AdminUiOperationValue = {
    component: component.ref,
    config: component.config,
  };

  if (kind === "add") {
    return {
      after: value,
      id: `add:${key}`,
      kind: "add",
      label: `Add Admin UI ${component.label}`,
    };
  }

  return {
    before: value,
    id: `remove:${key}`,
    kind: "remove",
    label: `Remove Admin UI ${component.label}`,
  };
}

/** Builds an `update` operation for a component whose config changed between versions. */
function buildUpdateOperation(
  key: string,
  before: AdminUiComponentDescriptor,
  after: AdminUiComponentDescriptor,
): ResourceOperation<AdminUiOperationValue> {
  return {
    after: { component: after.ref, config: after.config },
    before: { component: before.ref, config: before.config },
    id: `update:${key}`,
    kind: "update",
    label: `Update Admin UI ${after.label}`,
  };
}

/**
 * Diffs the baseline and target component maps into add/remove/update operations.
 * A component present on both sides with a changed config is an `update`; the
 * whole-config comparison covers ACL, labels, descriptions, and notifications.
 */
function diffComponents(
  baselineComponents: Map<string, AdminUiComponentDescriptor>,
  targetComponents: Map<string, AdminUiComponentDescriptor>,
): ResourceOperation<AdminUiOperationValue>[] {
  const operations: ResourceOperation<AdminUiOperationValue>[] = [];

  for (const [key, component] of targetComponents) {
    if (!baselineComponents.has(key)) {
      operations.push(buildComponentOperation("add", key, component));
    }
  }

  for (const [key, component] of baselineComponents) {
    const target = targetComponents.get(key);
    if (!target) {
      operations.push(buildComponentOperation("remove", key, component));
    } else if (stringify(component.config) !== stringify(target.config)) {
      operations.push(buildUpdateOperation(key, component, target));
    }
  }

  return operations;
}

/**
 * Plans the Admin UI extension transition by diffing the baseline and target
 * `adminUi` blocks component-by-component. Deterministic and free of network I/O
 * (it reads only the deployment namespace from the environment). Returns a
 * `blocked` result when work is planned but the extension identity cannot be
 * resolved (`__OW_NAMESPACE` unset).
 *
 * It emits one operation per component added in the target, removed from it, or
 * whose config changed between versions (an `update`); a component-less
 * `adminUi` block is a no-op. The single {@link AdminUiExtensionAction} on the
 * plan tells `apply` which whole-extension call converges those operations.
 */
export function planAdminUi(
  input: PlanningInput<AdminUiConfig, RegisterExtensionStepData>,
  _context: ValidationExecutionContext<AdminUiStepContext>,
): Promise<PlanningResult<AdminUiDomainPlan>> {
  const { path, baseline, targetConfig } = input;

  const baselineAdminUi = baseline ? baseline.config.adminUi : null;
  const targetAdminUi = targetConfig ? targetConfig.adminUi : null;

  const baselineComponents = baselineAdminUi
    ? enumerateComponents(baselineAdminUi)
    : new Map<string, AdminUiComponentDescriptor>();
  const targetComponents = targetAdminUi
    ? enumerateComponents(targetAdminUi)
    : new Map<string, AdminUiComponentDescriptor>();

  const operations = diffComponents(baselineComponents, targetComponents);

  // Lifecycle tracks component presence: the first component registers, the last
  // removal unregisters, and changes in between (add/remove/update) refresh. Each
  // action carries its own component ops, so no synthetic block-level op is needed.
  const baselineHasAdminUi = baselineComponents.size > 0;
  const targetHasAdminUi = targetComponents.size > 0;

  let extensionAction: AdminUiExtensionAction | null = null;
  if (!baselineHasAdminUi && targetHasAdminUi) {
    extensionAction = "register";
  } else if (baselineHasAdminUi && !targetHasAdminUi) {
    extensionAction = "unregister";
  } else if (baselineHasAdminUi && targetHasAdminUi && operations.length > 0) {
    extensionAction = "refresh";
  }

  // Any extension action needs the runtime identity at apply time, so if work is
  // planned but the namespace is unavailable, block with a machine-readable issue
  // rather than throwing and taking down the whole planning pass.
  if (extensionAction && !hasExtensionName()) {
    return Promise.resolve({
      issues: [
        {
          code: "admin-ui-namespace-unavailable",
          domain: "admin-ui",
          message:
            "Cannot resolve the Admin UI extension identity: the __OW_NAMESPACE environment variable is not set.",
        },
      ],
      kind: "blocked",
    });
  }

  return Promise.resolve({
    kind: "planned",
    plan: {
      baselineExtensionId: extractBaselineExtensionId(baseline),
      extensionAction,
      operations,
      path,
    },
  });
}
