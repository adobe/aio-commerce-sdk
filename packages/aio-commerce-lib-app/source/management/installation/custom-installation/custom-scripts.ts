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
import type { ConfigDiff } from "#management/upgrade/types";

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
 * @returns The resolved script module, or `undefined` if the script is not present in the context.
 */
function getScriptModule(
  customScripts: Record<string, unknown>,
  script: string,
): ScriptModule | undefined {
  let scriptModule = customScripts[script] as WithDefault<unknown>;

  if (!scriptModule) {
    return;
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

/** Diff kinds a reconcile handler needs to act on. */
const OPERATIVE = new Set(["added", "removed", "changed"]);

/**
 * Creates a leaf step for executing a single custom installation script.
 */
function createCustomScriptStep(scriptConfig: CustomInstallationStep): AnyStep {
  const { script, name, description } = scriptConfig;

  async function runInstall(
    config: ConfigWithInstallationSteps,
    context: ExecutionContext,
  ): Promise<ScriptExecutionResult> {
    const { logger } = context;
    const customScripts = context.customScripts || {};

    logger.info(`Executing custom installation script: ${name}`);
    logger.debug(`Script path: ${script}`);

    const scriptModule = getScriptModule(customScripts, script);
    if (!scriptModule) {
      throw new Error(
        `Script ${script} not found in customScripts context. Make sure the script is defined in the configuration and the action was generated with custom scripts support.`,
      );
    }

    const install = resolveCustomScriptHandler(scriptModule, "install");

    const scriptResult = await install(config, context);
    logger.info(`Successfully executed script: ${name}`);

    return {
      data: scriptResult,
      script,
    };
  }

  async function runUninstall(
    config: ConfigWithInstallationSteps,
    context: ExecutionContext,
  ): Promise<void> {
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
  }

  /**
   * Reconciles this custom step against the diff: `added` runs `install` (a genuine
   * first run has no idempotency concern); `removed` runs `uninstall` (same as
   * uninstall mode); `changed` skips with a warning instead of blindly re-running
   * `install` — the config schema has no way for a script to declare itself
   * idempotent (spec §8.3 idempotency-gap decision), so v1 defaults to the safe
   * choice of not re-executing a script whose config changed. Steps with no
   * relevant diff entry (unchanged, or not part of this update) are silently skipped.
   */
  async function reconcile(
    config: ConfigWithInstallationSteps,
    diff: ConfigDiff,
    context: ExecutionContext,
  ): Promise<ScriptExecutionResult | undefined> {
    const change = diff.changes.find(
      (candidate) =>
        candidate.domain === "customStep" &&
        candidate.identity === name &&
        OPERATIVE.has(candidate.kind),
    );

    if (!change) {
      return;
    }

    if (change.kind === "removed") {
      await runUninstall(config, context);
      return;
    }

    if (change.kind === "changed") {
      context.logger.warn(
        `Skipping re-apply of custom installation script "${name}": its configuration changed, but custom scripts have no way to declare themselves safe to re-run (idempotent) yet. Re-run install manually if this script needs to reflect the new configuration.`,
      );
      return;
    }

    // added: never executed before, so a first run has no idempotency concern.
    return runInstall(config, context);
  }

  return defineLeafStep({
    install: runInstall,
    meta: {
      install: {
        description,
        label: name,
      },
    },
    name: camelcase(name),
    reconcile,
    uninstall: runUninstall,
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
