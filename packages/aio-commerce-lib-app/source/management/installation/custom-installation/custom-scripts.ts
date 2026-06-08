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

import { parseOrThrow } from "@aio-commerce-sdk/common-utils/valibot";
import * as camelcaseModule from "camelcase";
import * as v from "valibot";

import { hasCustomInstallationSteps } from "#config/schema/installation";
import { defineLeafStep } from "#management/installation/workflow/step";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  ConfigWithInstallationSteps,
  CustomInstallationStep,
} from "#config/schema/installation";
import type {
  CustomInstallationStepDefinition,
  CustomInstallationStepHandler,
} from "#management/installation/custom-installation/define";
import type {
  AnyStep,
  ExecutionContext,
} from "#management/installation/workflow/step";

type CamelcaseInterop = typeof camelcaseModule.default & {
  default?: typeof camelcaseModule.default;
};

const camelcase =
  (camelcaseModule.default as CamelcaseInterop).default ??
  camelcaseModule.default;

type WithDefault<T> = T | { default: T };
type ScriptModule =
  | CustomInstallationStepDefinition
  | CustomInstallationStepHandler;

const ScriptModuleSchema = v.union([
  v.function(),
  v.object({
    install: v.function(),
    uninstall: v.optional(v.function()),
  }),
]);

/**
 * Validates that a loaded script export can be executed as a custom installation step.
 *
 * @param module - The loaded script export to validate.
 * @throws If the export is not a function or an object with an `install` function.
 */
function assertScriptModule(module: unknown): asserts module is ScriptModule {
  parseOrThrow(
    ScriptModuleSchema,
    module,
    "Invalid script module format. Expected a function or an object with an `install` method.",
  );
}

/**
 * Parses and validates a custom script module from the provided customScripts context.
 * It supports both direct function exports and default exports.
 *
 * @param customScripts - The customScripts context containing the loaded modules
 * @param script - The script path to resolve the module for
 */
function getScriptModule(
  customScripts: Record<string, unknown>,
  script: string,
): ScriptModule {
  let scriptModule = customScripts[script] as WithDefault<unknown>;

  if (!scriptModule) {
    throw new Error(
      `Script ${script} not found in customScripts context. Make sure the script is defined in the configuration and the action was generated with custom scripts support.`,
    );
  }

  if (typeof scriptModule === "object" && "default" in scriptModule) {
    scriptModule = scriptModule.default;
  }

  assertScriptModule(scriptModule);
  return scriptModule;
}

/**
 * Resolves the desired handler function from a custom script module. The module can either export
 * a single function (for install) or an object with install/uninstall methods.
 *
 * @param scriptModule - The loaded module
 * @param handler - The handler to resolve
 */

// Overload for `install` (should always return something).
function resolveCustomScriptHandler(
  scriptModule: ScriptModule,
  handler: "install",
): CustomInstallationStepHandler;

// Overload for `uninstall` (may return null if uninstall is not defined).
function resolveCustomScriptHandler(
  scriptModule: ScriptModule,
  handler: "uninstall",
): CustomInstallationStepHandler | null;

function resolveCustomScriptHandler(
  scriptModule: ScriptModule,
  handler: "install" | "uninstall",
) {
  // For export default / module.exports = defineCustomInstallationStep(() => {})
  if (typeof scriptModule === "function") {
    return handler === "install" ? scriptModule : null;
  }

  // For export default / module.exports = defineCustomInstallationStep({ install, uninstall })
  if (handler in scriptModule && typeof scriptModule[handler] === "function") {
    return scriptModule[handler];
  }

  return null;
}

/** Result of executing a single custom installation script. */
type ScriptExecutionResult = {
  /** The script path that was executed. */
  script: string;

  /** Any data returned by the script. */
  data?: unknown;
};

/**
 * Creates a leaf step for executing a single custom installation script.
 */
function createCustomScriptStep(scriptConfig: CustomInstallationStep): AnyStep {
  const { script, name, description } = scriptConfig;
  return defineLeafStep({
    name: camelcase(name),
    meta: {
      install: {
        label: name,
        description,
      },
    },

    install: async (
      config: ConfigWithInstallationSteps,
      context: ExecutionContext,
    ): Promise<ScriptExecutionResult> => {
      const { logger } = context;
      const customScripts = context.customScripts || {};

      logger.info(`Executing custom installation script: ${name}`);
      logger.debug(`Script path: ${script}`);

      const scriptModule = getScriptModule(customScripts, script);
      const install = resolveCustomScriptHandler(scriptModule, "install");

      const scriptResult = await install(config, context);
      logger.info(`Successfully executed script: ${name}`);

      return {
        script,
        data: scriptResult,
      };
    },

    uninstall: async (
      config: ConfigWithInstallationSteps,
      context: ExecutionContext,
    ): Promise<void> => {
      const { logger } = context;
      const customScripts = context.customScripts || {};
      logger.debug(`Uninstalling custom script: ${name}`);

      const scriptModule = getScriptModule(customScripts, script);
      const uninstall = resolveCustomScriptHandler(scriptModule, "uninstall");

      if (!uninstall) {
        logger.debug(
          `Script ${script} does not export an uninstall function, skipping uninstall.`,
        );

        return;
      }

      await uninstall(config, context);
      logger.info(`Successfully uninstalled script: ${name}`);
    },
  });
}

/**
 * Creates child steps dynamically based on the custom installation scripts
 * defined in the configuration. Each script becomes a separate leaf step.
 */
export function createCustomScriptSteps(
  config: CommerceAppConfigOutputModel,
): AnyStep[] {
  if (!hasCustomInstallationSteps(config)) {
    return [];
  }

  const steps = config.installation.customInstallationSteps;
  const uniqueNames = new Set<string>(steps.map((step) => step.name));

  if (uniqueNames.size !== steps.length) {
    throw new Error(
      "Duplicate step names detected in custom installation steps. Each step must have a unique name.",
    );
  }

  return steps.map((scriptConfig) => createCustomScriptStep(scriptConfig));
}
