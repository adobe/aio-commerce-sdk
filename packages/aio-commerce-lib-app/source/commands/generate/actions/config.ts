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

import { join } from "node:path";

import { GENERATED_ACTIONS_PATH, PACKAGE_NAME } from "#commands/constants";
import { requiresInstallation } from "#config/schema/app";
import { hasBusinessConfigSchema } from "#config/schema/business-configuration";

import { COMMERCE_ACTION_INPUTS } from "./constants";

import type {
  ActionDefinition,
  ExtConfig,
} from "@aio-commerce-sdk/scripting-utils/yaml";
import type { AdminUi } from "#config/schema/admin-ui";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";

type ActionConfig = {
  requiresSchema?: boolean;
  requiresEncryptionKey?: boolean;
};

export type TemplateAction = ActionConfig & {
  name: string;
  templateFile: string;
};

/**
 * Creates a runtime action configuration.
 * @param actionName - The name of the action.
 * @param config - Action generation options.
 * @param options - Optional configuration options.
 */
function createActionDefinition(
  actionName: string,
  config: ActionConfig = {},
  options: Omit<ActionDefinition, "function"> = {},
) {
  const def: ActionDefinition = {
    ...options,
    annotations: {
      final: true,
      "require-adobe-auth": true,
    },

    function: `${GENERATED_ACTIONS_PATH}/${actionName}.js`,
    runtime: "nodejs:24",
    web: options.web ?? "yes",
  };

  if (config.requiresEncryptionKey) {
    def.inputs = {
      ...def.inputs,
      AIO_COMMERCE_CONFIG_ENCRYPTION_KEY: "$AIO_COMMERCE_CONFIG_ENCRYPTION_KEY",
    };
  }

  return def;
}

/**
 * Gets the runtime actions to be generated from the ext.config.yaml configuration.
 * @param extConfig - The ext.config.yaml configuration.
 * @param dir - Directory containing the runtime action templates.
 */
export function getRuntimeActions(extConfig: ExtConfig, dir: string) {
  return Object.entries(
    extConfig.runtimeManifest?.packages?.[PACKAGE_NAME]?.actions ?? {},
  ).map(
    ([name, _]) =>
      ({
        name,
        templateFile: join(dir, `${name}.js.template`),
      }) satisfies TemplateAction,
  );
}

/**
 * Builds the ext.config.yaml configuration for the extensibility extension.
 * @param appConfig - Parsed app configuration.
 */
export function buildAppManagementExtConfig(
  appConfig: CommerceAppConfigOutputModel,
) {
  const extConfig = {
    hooks: {
      "pre-app-build":
        "EXTENSION=extensibility/1 $packageExec aio-commerce-lib-app hooks pre-app-build",
    },

    operations: {
      workerProcess: [
        {
          impl: `${PACKAGE_NAME}/app-config`,
          type: "action",
        },
        {
          impl: `${PACKAGE_NAME}/association`,
          type: "action",
        },
      ],
    },

    runtimeManifest: {
      packages: {
        [PACKAGE_NAME]: {
          actions: {
            "app-config": createActionDefinition("app-config"),
            association: createActionDefinition("association"),
          } as Record<string, ActionDefinition>,
          license: "Apache-2.0",
        },
      },
    },
  } satisfies ExtConfig;

  const needsInstallAction = requiresInstallation(appConfig);
  const hasPasswordFieldsInSchema =
    hasBusinessConfigSchema(appConfig) &&
    appConfig.businessConfig.schema.some((field) => field.type === "password");

  if (needsInstallAction) {
    extConfig.operations.workerProcess.push({
      impl: `${PACKAGE_NAME}/installation`,
      type: "action",
    });

    extConfig.runtimeManifest.packages[PACKAGE_NAME].actions.installation =
      createActionDefinition(
        "installation",
        { requiresEncryptionKey: hasPasswordFieldsInSchema },
        {
          inputs: { ...COMMERCE_ACTION_INPUTS, LOG_LEVEL: "$LOG_LEVEL" },
          limits: {
            timeout: 600_000,
          },
        },
      );
  }

  return extConfig;
}

/** Builds the ext.config.yaml configuration for the business configuration extension. */
export function buildBusinessConfigurationExtConfig() {
  const actions = [
    {
      name: "config",
      requiresEncryptionKey: true,
      templateFile: "config.js.template",
    },
    {
      name: "scope-tree",
      templateFile: "scope-tree.js.template",
    },
  ] satisfies TemplateAction[];

  return {
    hooks: {
      "pre-app-build":
        "EXTENSION=configuration/1 $packageExec aio-commerce-lib-app hooks pre-app-build",
    },

    operations: {
      workerProcess: actions.map((action) => ({
        impl: `${PACKAGE_NAME}/${action.name}`,
        type: "action",
      })),
    },

    runtimeManifest: {
      packages: {
        [PACKAGE_NAME]: {
          actions: Object.fromEntries(
            actions.map((action) => [
              action.name,
              createActionDefinition(action.name, action),
            ]),
          ),
          license: "Apache-2.0",
        },
      },
    },
  } satisfies ExtConfig;
}

/** Collects unique `runtimeAction` strings from all worker entries in an `adminUi` config. */
export function collectUniqueRuntimeActions(
  adminUi: AdminUi | undefined,
): string[] {
  const entities = (["order", "product", "customer"] as const).map(
    (key) => adminUi?.[key],
  );
  const gridRuntimeActions = entities
    .map((entity) => entity?.gridColumns?.runtimeAction)
    .filter((action): action is string => action !== undefined);
  const massActionRuntimeActions = entities
    .flatMap((entity) => entity?.massActions ?? [])
    .filter((action) => action.type === "worker")
    .map((action) => action.runtimeAction);
  const viewButtonRuntimeActions = (adminUi?.order?.viewButtons ?? [])
    .filter((button) => button.type === "worker")
    .map((button) => button.runtimeAction);
  return [
    ...new Set([
      ...gridRuntimeActions,
      ...massActionRuntimeActions,
      ...viewButtonRuntimeActions,
    ]),
  ];
}

/** Returns true if the `adminUi` config requires a `view` operation and `web` source in ext.config.yaml. */
export function requiresWebSource(adminUi: AdminUi | undefined): boolean {
  if (adminUi?.menu !== undefined) {
    return true;
  }
  if (
    (adminUi?.order?.viewButtons ?? []).some((button) => button.type === "view")
  ) {
    return true;
  }
  const entities = (["order", "product", "customer"] as const).map(
    (key) => adminUi?.[key],
  );
  return entities
    .flatMap((entity) => entity?.massActions ?? [])
    .some((action) => action.type === "view");
}

/**
 * Builds the ext.config.yaml for the Admin UI v2 extension (`commerce/backend-ui/2`).
 * Derives `workerProcess` and `view` operation declarations from `adminUi` config.
 * Adds a `view` operation and `web` source when view-type entries or `adminUi.menu` is configured.
 * @param appConfig - Parsed app configuration.
 */
export function buildAdminUiV2ExtConfig(
  appConfig: CommerceAppConfigOutputModel,
) {
  const { adminUi } = appConfig;
  const runtimeActions = collectUniqueRuntimeActions(adminUi);
  const requiresWeb = requiresWebSource(adminUi);
  return {
    hooks: {
      "pre-app-build":
        "EXTENSION=backend-ui/2 $packageExec aio-commerce-lib-app hooks pre-app-build",
    },
    operations: {
      ...(requiresWeb && {
        view: [{ impl: "index.html", type: "web" as const }],
      }),
      ...(runtimeActions.length > 0 && {
        workerProcess: runtimeActions.map((impl) => ({
          impl,
          type: "action" as const,
        })),
      }),
    },
    ...(requiresWeb && {
      web: "web-src",
    }),
  } satisfies ExtConfig;
}
