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

/**
 * Returns `baseKey`, or `baseKey#N` (N starting at 2) when it is already taken.
 * The schema does not enforce unique mass-action/view-button ids, so array-based
 * components must not collapse onto a shared map key — otherwise a change in the
 * count of duplicate-id items would diff to a silent no-op.
 */
function disambiguateKey(
  components: Map<string, AdminUiComponentDescriptor>,
  baseKey: string,
): string {
  if (!components.has(baseKey)) {
    return baseKey;
  }

  let occurrence = 2;
  while (components.has(`${baseKey}#${occurrence}`)) {
    occurrence += 1;
  }
  return `${baseKey}#${occurrence}`;
}

/**
 * Enumerates the individual components declared in an `adminUi` block, keyed by a
 * stable identity so the baseline and target can be diffed component-by-component.
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

  for (const entity of ["order", "product", "customer"] as const) {
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
        ref: { entity, kind: "grid-columns" },
      });
    }

    for (const massAction of entityConfig.massActions ?? []) {
      const key = disambiguateKey(
        components,
        `${entity}.mass-action.${massAction.id}`,
      );
      components.set(key, {
        config: massAction,
        key,
        label: `${entity} mass action "${massAction.id}"`,
        ref: { entity, id: massAction.id, kind: "mass-action" },
      });
    }
  }

  for (const viewButton of adminUi.order?.viewButtons ?? []) {
    const key = disambiguateKey(
      components,
      `order.view-button.${viewButton.id}`,
    );
    components.set(key, {
      config: viewButton,
      key,
      label: `order view button "${viewButton.id}"`,
      ref: { entity: "order", id: viewButton.id, kind: "view-button" },
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

/** Diffs the baseline and target component maps into add/remove operations. */
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

  // A component present on both sides with a changed config is a modification;
  // this domain does not yet diff configs, so it is intentionally not emitted.
  for (const [key, component] of baselineComponents) {
    if (!targetComponents.has(key)) {
      operations.push(buildComponentOperation("remove", key, component));
    }
  }

  return operations;
}

/** Builds a block-level `add` or `remove` operation for the bare extension registration. */
function buildExtensionOperation(
  kind: "add" | "remove",
): ResourceOperation<AdminUiOperationValue> {
  const value: AdminUiOperationValue = { component: { kind: "extension" } };

  if (kind === "add") {
    return {
      after: value,
      id: "add:extension",
      kind: "add",
      label: "Register Admin UI extension",
    };
  }

  return {
    before: value,
    id: "remove:extension",
    kind: "remove",
    label: "Unregister Admin UI extension",
  };
}

/**
 * Plans the Admin UI extension transition by diffing the baseline and target
 * `adminUi` blocks component-by-component. Deterministic and free of network I/O
 * (it reads only the deployment namespace from the environment). Returns a
 * `blocked` result when work is planned but the extension identity cannot be
 * resolved (`__OW_NAMESPACE` unset).
 *
 * It emits one operation per component added in the target or removed from it,
 * or a single block-level operation when an empty `adminUi` block appears or
 * disappears. Component config changes are not diffed here. The single
 * {@link AdminUiExtensionAction} on the plan tells `apply` which whole-extension
 * call converges all of those operations.
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

  // The extension is registered in Commerce whenever the `adminUi` block is
  // present (`registerExtensionStep.install` runs on `hasAdminUi`, even with zero
  // components), so its lifecycle tracks block presence, not component count:
  // an appearing block registers, a disappearing block unregisters, and a block
  // present on both sides refreshes only when a component actually changed.
  const baselineHasBlock = Boolean(baselineAdminUi);
  const targetHasBlock = Boolean(targetAdminUi);

  let extensionAction: AdminUiExtensionAction | null = null;
  if (!baselineHasBlock && targetHasBlock) {
    extensionAction = "register";
  } else if (baselineHasBlock && !targetHasBlock) {
    extensionAction = "unregister";
  } else if (baselineHasBlock && targetHasBlock && operations.length > 0) {
    extensionAction = "refresh";
  }

  // The engine runs `apply` only for domains that report operations (execute.ts
  // `hasPlannedOperations`). A register/unregister driven by an empty block has
  // no component operation to carry it, so emit a block-level one.
  if (
    (extensionAction === "register" || extensionAction === "unregister") &&
    operations.length === 0
  ) {
    operations.push(
      buildExtensionOperation(
        extensionAction === "register" ? "add" : "remove",
      ),
    );
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
