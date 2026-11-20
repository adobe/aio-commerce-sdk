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

import * as camelcaseModule from "camelcase";

import { hasCustomInstallationSteps } from "#config/schema/installation";
import { defineLeafStep } from "#management/common/workflow/step";
import { createDeprecatedCustomScriptHandlers } from "#management/deprecated/domains/custom-installation";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { CustomInstallationStep } from "#config/schema/installation";
import type { AnyStep } from "#management/common/workflow/step";

type CamelcaseInterop = typeof camelcaseModule.default & {
  default?: typeof camelcaseModule.default;
};

const camelcase =
  (camelcaseModule.default as CamelcaseInterop).default ??
  camelcaseModule.default;

/** The custom installation step the config declares with the given name, if any. */
export function findDeclaredStep(
  config: CommerceAppConfigOutputModel,
  name: string,
): CustomInstallationStep | undefined {
  return hasCustomInstallationSteps(config)
    ? config.installation.customInstallationSteps.find(
        (step) => step.name === name,
      )
    : undefined;
}

/**
 * The name of the leaf step that runs a custom installation step, which is also the key its run
 * record is stored under.
 *
 * @param name - The `name` of the custom installation step.
 */
export function getCustomScriptStepName(name: string): string {
  return camelcase(name);
}

/**
 * Creates a leaf step for executing a single custom installation script.
 */
export function createCustomScriptStep(
  scriptConfig: CustomInstallationStep,
): AnyStep {
  const { name, description } = scriptConfig;
  return defineLeafStep({
    ...createDeprecatedCustomScriptHandlers(scriptConfig),
    meta: {
      install: {
        description,
        label: name,
      },
      uninstall: {
        description,
        label: name,
      },
      upgrade: {
        description,
        label: name,
      },
    },
    name: getCustomScriptStepName(name),
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
