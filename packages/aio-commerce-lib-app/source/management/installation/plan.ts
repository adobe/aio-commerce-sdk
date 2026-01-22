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

import { phaseDefinitions } from "./phases";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { AnyPhaseDefinition } from "./phases";

/** A step that will be executed. */
export type PlannedStep<TStepName extends string = string> = {
  /** Step identifier */
  name: TStepName;
};

/** Derives a planned phase type from a phase definition. */
type PlannedPhaseFor<D extends AnyPhaseDefinition> = {
  name: D["name"];
  steps: PlannedStep<D["order"][number]>[];
};

/** Union of all phase plans, derived from phaseDefinitions. */
export type PlannedPhase = PlannedPhaseFor<AnyPhaseDefinition>;

/**
 * Installation plan - serializable, immutable snapshot.
 * Contains only phases/steps that WILL execute.
 */
export type InstallationPlan = {
  /** Unique installation identifier (UUID). */
  id: string;

  /** ISO timestamp when plan was created. */
  createdAt: string;

  /** Phases to execute, in order. */
  phases: PlannedPhase[];
};

/**
 * Creates an installation plan from configuration.
 * Evaluates all conditions to determine what will run.
 */
export function createInstallationPlan(
  config: CommerceAppConfigOutputModel,
): InstallationPlan {
  const phases: PlannedPhase[] = [];

  for (const definition of phaseDefinitions) {
    // Phase-level condition
    if (!definition.shouldRun(config)) {
      continue;
    }

    const steps: PlannedStep[] = [];

    for (const stepName of definition.order) {
      const stepConditions = definition.stepConditions as Record<
        string,
        ((phaseConfig: typeof config) => boolean) | undefined
      >;
      const condition = stepConditions[stepName];

      if (condition !== undefined && !condition(config)) {
        continue; // Skip this step
      }

      steps.push({ name: stepName });
    }

    if (steps.length > 0) {
      phases.push({
        name: definition.name,
        steps,
      } as PlannedPhase);
    }
  }

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    phases,
  };
}
