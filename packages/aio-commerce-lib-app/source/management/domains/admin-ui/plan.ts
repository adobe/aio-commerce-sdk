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

import { tryResolveExtensionIdentity } from "./helpers";

import type { AdminUi, AdminUiConfig } from "#config/schema/admin-ui";
import type {
  CleanupResource,
  PlanningInput,
  PlanningResult,
  ResourceOperation,
} from "#management/common/workflow/resource";
import type { ValidationExecutionContext } from "#management/common/workflow/step";
import type {
  AdminUiComponentConfig,
  AdminUiComponentRef,
  AdminUiDomainPlan,
  AdminUiExtensionAction,
  AdminUiIdentity,
  AdminUiOperationValue,
  AdminUiSnapshotData,
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
  baseline: { data: AdminUiSnapshotData } | null,
): string | null {
  return baseline?.data.extensionId ?? null;
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
      category: "configuration",
      id: `add:${key}`,
      kind: "add",
      label: `Add Admin UI ${component.label}`,
    };
  }

  return {
    before: value,
    category: "configuration",
    id: `remove:${key}`,
    kind: "remove",
    label: `Remove Admin UI ${component.label}`,
  };
}

/**
 * Plans the Admin UI extension transition by diffing the baseline and target
 * `adminUi` blocks component-by-component. Deterministic and free of network I/O
 * (it reads only the deployment namespace from the environment). Returns a
 * `blocked` result when work is planned but the extension identity cannot be
 * resolved (`__OW_NAMESPACE` unset), rather than throwing.
 *
 * It emits one operation per component added in the target or removed from it.
 * Config changes to a component present on both sides are intentionally left out:
 * modifying existing components is owned by CEXT-6510, and this ticket must not
 * touch them. The single {@link AdminUiExtensionAction} on the plan tells `apply`
 * how to converge those operations, since Commerce has no per-component API.
 */
export function planAdminUi(
  input: PlanningInput<AdminUiConfig, AdminUiSnapshotData, AdminUiIdentity>,
  context: ValidationExecutionContext<AdminUiStepContext>,
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

  const operations: ResourceOperation<AdminUiOperationValue>[] = [];

  for (const [key, component] of targetComponents) {
    if (!baselineComponents.has(key)) {
      operations.push(buildComponentOperation("add", key, component));
    }
  }

  for (const [key, component] of baselineComponents) {
    if (!targetComponents.has(key)) {
      operations.push(buildComponentOperation("remove", key, component));
    }
    // A changed config for a component on both sides is a modification, which this
    // step intentionally does not emit.
  }

  // The engine runs `apply` only for domains that report operations
  // (execute.ts `hasPlannedOperations`), so gate on operations first.
  //
  // Key the choice on component-set sizes, not block presence: an empty baseline
  // block registered nothing, so gaining a component is a first-time `register`
  // (which records the cleanup resource), not a `refresh` that would leave the
  // new extension untracked.
  let extensionAction: AdminUiExtensionAction | null = null;
  if (operations.length > 0) {
    if (baselineComponents.size === 0) {
      extensionAction = "register";
    } else if (targetComponents.size === 0) {
      extensionAction = "unregister";
    } else {
      extensionAction = "refresh";
    }
  }

  // Any extension action needs the runtime identity at apply time, so if work is
  // planned but the namespace is unavailable, block with a machine-readable issue
  // rather than throwing and taking down the whole planning pass.
  const identity = tryResolveExtensionIdentity(context);
  if (extensionAction && !identity) {
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

  const possibleCleanupResources: CleanupResource<AdminUiIdentity>[] =
    extensionAction === "register" && identity ? [{ identity, path }] : [];

  return Promise.resolve({
    kind: "planned",
    plan: {
      baselineExtensionId: extractBaselineExtensionId(baseline),
      extensionAction,
      identity,
      operations,
      path,
      possibleCleanupResources,
    },
  });
}
