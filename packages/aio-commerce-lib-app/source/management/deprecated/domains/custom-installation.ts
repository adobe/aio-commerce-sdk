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

import { hasCustomInstallationSteps } from "#config/schema/installation";
import {
  getScriptModule,
  getScriptModuleOrThrow,
  resolveCustomScriptHandler,
} from "#management/domains/custom-installation/custom-scripts";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  ConfigWithInstallationSteps,
  CustomInstallationStep,
} from "#config/schema/installation";
import type { ExecutionContext } from "#management/common/workflow/step";
import type {
  CustomInstallationSnapshotData,
  CustomInstallationStepIdentity,
} from "#management/domains/custom-installation/types";

/** Result of executing a single custom installation script. */
type ScriptExecutionResult = {
  /** The script path that was executed. */
  script: string;

  /** Any data returned by the script. */
  data?: unknown;
};

/**
 * Creates the legacy install/uninstall handlers of a custom installation script leaf.
 * Deleted in the next major.
 *
 * @param scriptConfig - The custom installation step the handlers belong to.
 */
export function createDeprecatedCustomScriptHandlers(
  scriptConfig: CustomInstallationStep,
) {
  const { script, name } = scriptConfig;

  return {
    install: async (
      config: ConfigWithInstallationSteps,
      context: ExecutionContext,
    ): Promise<ScriptExecutionResult> => {
      const { logger } = context;
      const customScripts = context.customScripts || {};

      logger.info(`Executing custom installation script: ${name}`);
      logger.debug(`Script path: ${script}`);

      const scriptModule = getScriptModuleOrThrow(customScripts, script);
      const install = resolveCustomScriptHandler(scriptModule, "install");

      const scriptResult = await install(config, context);
      logger.info(`Successfully executed script: ${name}`);

      return {
        data: scriptResult,
        script,
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
      if (!scriptModule) {
        logger.warn(
          `Script ${script} not found in customScripts context, skipping uninstall. It may have been removed from the project after being configured.`,
        );

        return;
      }

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
  };
}

/** Legacy install handler for the custom installation reconciliation leaf. Deleted in the next major. */
export const deprecatedReconciliationStep = {
  // Unused in practice: this leaf only runs on upgrade (via `apply`), but `LeafStep` requires an
  // `install`.
  install: (
    config: CommerceAppConfigOutputModel,
  ): CustomInstallationSnapshotData => {
    if (!hasCustomInstallationSteps(config)) {
      return { executedSteps: [] };
    }

    const executedSteps: CustomInstallationStepIdentity[] =
      config.installation.customInstallationSteps.map((step) => ({
        name: step.name,
        script: step.script,
      }));

    return { executedSteps };
  },
};
