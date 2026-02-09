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
  ExecutionContext,
  InferStepOutput,
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
  /** The name of the step. */
  name: string;

  /** The script path that was executed. */
  script: string;

  /** Any data returned by the script. */
  data?: unknown;
};

export const executeCustomInstallationScripts = defineLeafStep({
  name: "execute-scripts",
  meta: {
    label: "Execute Custom Scripts",
    description:
      "Runs custom installation scripts defined in the configuration",
  },

  when: hasCustomInstallationSteps,
  run: async (config: CustomInstallationConfig, context: ExecutionContext) => {
    const { logger } = context;

    const customScripts = context.customScripts || {};

    logger.debug(
      `Starting execution of ${config.installation?.customInstallationSteps.length} custom installation script(s)`,
    );

    const results: ScriptExecutionResult[] = [];

    for (const step of config.installation?.customInstallationSteps || []) {
      const { script, name, description } = step;

      logger.info(`Executing custom installation script: ${name}`);
      logger.debug(`Script path: ${script}, Description: ${description}`);

      try {
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

        results.push({
          name,
          script,
          data: scriptResult,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(`Failed to execute script ${name}: ${errorMessage}`);

        throw new Error(
          `Custom installation script "${name}" failed: ${errorMessage}`,
        );
      }
    }

    logger.debug("Completed custom installation scripts execution step.");
    return results;
  },
});

/** The output data of the custom installation scripts step (auto-inferred). */
export type CustomInstallationScriptsStepData = InferStepOutput<
  typeof executeCustomInstallationScripts
>;
