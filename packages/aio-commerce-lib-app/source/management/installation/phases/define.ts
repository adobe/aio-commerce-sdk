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

import type { EmptyObject, SimplifyDeep } from "type-fest";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  AllPhaseData,
  DataBefore,
  GenericPhaseDef,
  InstallationContext,
  PhaseDefinition,
  PhaseFailure,
  PhaseRunner,
  StepContext,
  StepFailure,
  StepResult,
  StepSuccess,
} from "#management/installation/types";

/**
 * Creates a phase runner from a phase definition.
 * Note: stepConditions are NOT evaluated here - they're for plan building only.
 * The runner will be updated to follow the plan in a future iteration.
 *
 * @param definition - The phase definition containing all phase metadata.
 * @returns A phase runner function.
 */
export function createPhaseRunner<
  Phase extends GenericPhaseDef,
  TConfig extends CommerceAppConfigOutputModel = CommerceAppConfigOutputModel,
  TPhaseContext = EmptyObject,
>(
  definition: PhaseDefinition<Phase, TConfig, TPhaseContext>,
): PhaseRunner<Phase> {
  const {
    name: phase,
    order,
    executors,
    shouldRun,
    createPhaseContext,
  } = definition;
  return async (
    config: CommerceAppConfigOutputModel,
    installationContext: InstallationContext,
  ) => {
    if (!shouldRun(config)) {
      return {
        status: "skipped",
        reason:
          "The `shouldRun` handler determined that this phase should be skipped",
      };
    }

    // Create phase context once before the phase starts (defaults to empty object if no factory provided)
    const phaseContext = createPhaseContext
      ? await createPhaseContext(installationContext)
      : ({} as TPhaseContext);

    let accumulated = {};

    for (const step of order) {
      const executor = executors[step as keyof typeof executors];
      const data = accumulated as SimplifyDeep<
        DataBefore<Phase["order"], Phase["steps"], typeof step>
      >;

      const stepContext: StepContext<Phase, typeof step, TPhaseContext> = {
        phase,
        step,

        installationContext,
        phaseContext,
        data,

        helpers: {
          stepFailed: (key, errorPayload) => {
            return {
              success: false as const,
              error: { key, ...errorPayload },
            } as unknown as StepFailure<Phase, typeof step>;
          },

          stepSuccess: (data) => {
            return {
              success: true as const,
              data,
            } as StepSuccess<Phase, typeof step>;
          },
        },
      };

      let result: StepResult<Phase, typeof step>;
      try {
        result = await executor(config, stepContext);
      } catch (error) {
        result = {
          success: false as const,
          error: {
            key: "UNEXPECTED_ERROR" as const,
            error: new Error("An unexpected error occurred", {
              cause: error,
            }),
          },
        };
      }

      if (result.success) {
        if (typeof result.data === "object" && result.data !== null) {
          accumulated = { ...accumulated, ...result.data };
        }
      } else {
        return {
          status: "failed",
          step,
          error: result.error,
        } as PhaseFailure<Phase>;
      }
    }

    return {
      status: "succeeded",
      data: accumulated as SimplifyDeep<AllPhaseData<Phase>>,
    };
  };
}
