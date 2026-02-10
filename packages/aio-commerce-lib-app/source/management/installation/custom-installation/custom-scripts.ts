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

import { defineLeafStep } from "#management/installation/workflow/step";

import type { SetRequiredDeep } from "type-fest";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  AnyStep,
  ExecutionContext,
} from "#management/installation/workflow/step";

/** Config type when custom installation steps are present. */
export type CustomInstallationConfig = SetRequiredDeep<
  CommerceAppConfigOutputModel,
  "installation.customInstallationSteps"
>;

/** Check if config has custom installation steps. */
export function hasCustomInstallationSteps(
  config: CommerceAppConfigOutputModel,
): config is CustomInstallationConfig {
  return (
    Array.isArray(config?.installation?.customInstallationSteps) &&
    config.installation.customInstallationSteps.length > 0
  );
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
function createCustomScriptStep(scriptConfig: {
  script: string;
  name: string;
  description: string;
}): AnyStep {
  const { script, name, description } = scriptConfig;

  return defineLeafStep({
    name,
    meta: {
      label: name,
      description: description || `Execute custom script: ${script}`,
    },

    run: async (
      config: CustomInstallationConfig,
      context: ExecutionContext,
    ): Promise<ScriptExecutionResult> => {
      const { logger } = context;
      const customScripts = context.customScripts || {};

      logger.info(`Executing custom installation script: ${name}`);
      logger.debug(`Script path: ${script}`);

      const scriptModule = customScripts[script];

      if (!scriptModule) {
        throw new Error(
          `Script ${script} not found in customScripts context. Make sure the script is defined in the configuration and the action was generated with custom scripts support.`,
        );
      }

      // Only support default export
      if (typeof scriptModule !== "object" || !("default" in scriptModule)) {
        throw new Error(
          `Script ${script} must export a default function. Use defineCustomInstallationStep helper.`,
        );
      }

      const runFunction = scriptModule.default;

      if (typeof runFunction !== "function") {
        throw new Error(
          `Script ${script} default export must be a function, got ${typeof runFunction}`,
        );
      }

      const scriptResult = await runFunction(config, context);
      logger.info(`Successfully executed script: ${name}`);

      return {
        script,
        data: scriptResult,
      };
    },
  });
}

/**
 * Creates child steps dynamically based on the custom installation scripts
 * defined in the configuration. Each script becomes a separate leaf step.
 */
export function createCustomScriptSteps(
  config: CommerceAppConfigOutputModel,
): AnyStep[] | undefined {
  if (!hasCustomInstallationSteps(config)) {
    return [];
  }

  return config?.installation?.customInstallationSteps.map((scriptConfig) =>
    createCustomScriptStep(scriptConfig),
  );
}
