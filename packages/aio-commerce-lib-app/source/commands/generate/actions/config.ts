/*
 * Copyright 2025 Adobe. All rights reserved.
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

import {
  CONFIG_SCHEMA_FILE_NAME,
  GENERATED_ACTIONS_PATH,
  GENERATED_PATH,
  PACKAGE_NAME,
} from "#commands/constants";

import type {
  ActionDefinition,
  ExtConfig,
} from "@aio-commerce-sdk/scripting-utils/yaml";
import type { CommerceAppConfigDomain } from "#config/schema/domains";

type ActionConfig = {
  requiresSchema?: boolean;
  requiresEncryptionKey?: boolean;
};

export type TemplateAction = ActionConfig & {
  name: string;
  templateFile: string;
};

/** The list of Commerce variables that are required for the runtime actions */
export const COMMERCE_VARIABLES = [
  "AIO_COMMERCE_API_BASE_URL",
  "AIO_COMMERCE_AUTH_IMS_CLIENT_ID",
  "AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS",
  "AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID",
  "AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL",
  "AIO_COMMERCE_AUTH_IMS_ORG_ID",
  "AIO_COMMERCE_AUTH_IMS_SCOPES",
] as const satisfies string[];

/** The inputs for the generated runtime actions */
export const COMMERCE_ACTION_INPUTS = Object.fromEntries(
  COMMERCE_VARIABLES.map((variable) => [variable, `$${variable}`] as const),
);

export const CUSTOM_IMPORTS_PLACEHOLDER = "// {{CUSTOM_SCRIPTS_IMPORTS}}";
export const CUSTOM_SCRIPTS_MAP_PLACEHOLDER = "// {{CUSTOM_SCRIPTS_MAP}}";
export const CUSTOM_SCRIPTS_LOADER_PLACEHOLDER = "// {{CUSTOM_SCRIPTS_LOADER}}";

/**
 * Creates a runtime action configuration.
 * @param actionName - The name of the action.
 * @param options - Optional configuration options.
 */
function createActionDefinition(
  actionName: string,
  config: ActionConfig = {},
  options: Omit<ActionDefinition, "function"> = {},
) {
  const def: ActionDefinition = {
    ...options,

    function: `${GENERATED_ACTIONS_PATH}/${actionName}.js`,
    web: options.web ?? "yes",
    runtime: "nodejs:22",
    annotations: {
      "require-adobe-auth": true,
      final: true,
    },
  };

  if (config.requiresSchema) {
    def.include = [
      [`${GENERATED_PATH}/${CONFIG_SCHEMA_FILE_NAME}`, `${PACKAGE_NAME}/`],
    ];
  }

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
 * @param features - The features that are enabled for the app.
 */
export function buildAppManagementExtConfig(
  features: Set<CommerceAppConfigDomain>,
) {
  const extConfig = {
    hooks: {
      "pre-app-build":
        "EXTENSION=extensibility/1 $packageExec aio-commerce-lib-app hooks pre-app-build",
    },

    operations: {
      workerProcess: [
        {
          type: "action",
          impl: `${PACKAGE_NAME}/get-app-config`,
        },
      ],
    },

    runtimeManifest: {
      packages: {
        [PACKAGE_NAME]: {
          license: "Apache-2.0",
          actions: {
            "get-app-config": createActionDefinition("get-app-config"),
          } as Record<string, ActionDefinition>,
        },
      },
    },
  } satisfies ExtConfig;

  const featuresRequiringInstallationAction: CommerceAppConfigDomain[] = [
    "installation.customInstallationSteps",
    "eventing.commerce",
    "eventing.external",
  ];

  if (
    featuresRequiringInstallationAction.some((feature) => features.has(feature))
  ) {
    extConfig.operations.workerProcess.push({
      type: "action",
      impl: `${PACKAGE_NAME}/installation`,
    });

    extConfig.runtimeManifest.packages[PACKAGE_NAME].actions.installation =
      createActionDefinition(
        "installation",
        {},
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
      name: "get-scope-tree",
      templateFile: "get-scope-tree.js.template",
    },
    {
      name: "get-config-schema",
      templateFile: "get-config-schema.js.template",
      requiresSchema: true,
    },
    {
      name: "get-configuration",
      templateFile: "get-configuration.js.template",
      requiresSchema: true,
      requiresEncryptionKey: true,
    },
    {
      name: "set-configuration",
      templateFile: "set-configuration.js.template",
      requiresEncryptionKey: true,
    },
    {
      name: "set-custom-scope-tree",
      templateFile: "set-custom-scope-tree.js.template",
    },
    {
      name: "sync-commerce-scopes",
      templateFile: "sync-commerce-scopes.js.template",
    },
    {
      name: "unsync-commerce-scopes",
      templateFile: "unsync-commerce-scopes.js.template",
    },
  ] satisfies TemplateAction[];

  return {
    hooks: {
      "pre-app-build":
        "EXTENSION=configuration/1 $packageExec aio-commerce-lib-app hooks pre-app-build",
    },

    operations: {
      workerProcess: actions.map((action) => ({
        type: "action",
        impl: `${PACKAGE_NAME}/${action.name}`,
      })),
    },

    runtimeManifest: {
      packages: {
        [PACKAGE_NAME]: {
          license: "Apache-2.0",
          actions: Object.fromEntries(
            actions.map((action) => [
              action.name,
              createActionDefinition(action.name, action),
            ]),
          ),
        },
      },
    },
  } satisfies ExtConfig;
}
