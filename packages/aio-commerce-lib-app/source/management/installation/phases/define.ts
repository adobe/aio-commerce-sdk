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

import type { SimplifyDeep } from "type-fest";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  AllPhaseData,
  DataBefore,
  InstallationContext,
  PhaseDef,
  PhaseExecutors,
  PhaseFailure,
  PhaseRunner,
  StepContext,
  StepFailure,
  StepRecord,
  StepResult,
  StepSuccess,
} from "#management/installation/types";

/**
 * Defines a phase with its order and executors.
 * @param phase - The phase identifier.
 * @param order - The order of steps in the phase.
 * @param executors - The executors for each step in the phase.
 * @param shouldRun - Type guard that checks if the config is applicable for this phase.
 */
export function definePhase<
  const Order extends string[],
  const Steps extends StepRecord<Order>,
  const PhaseName extends string,
  const Phase extends PhaseDef<PhaseName, Order, Steps>,
  TConfig extends CommerceAppConfigOutputModel = CommerceAppConfigOutputModel,
>(
  phase: PhaseName,
  order: Order,
  executors: PhaseExecutors<Phase, TConfig>,
  shouldRun: (config: CommerceAppConfigOutputModel) => config is TConfig,
): PhaseRunner<Phase> {
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

    let accumulated = {};

    for (const step of order) {
      const executor = executors[step as keyof typeof executors];
      const stepContext: StepContext<Phase, typeof step> = {
        phase,
        step,

        installationContext,
        data: accumulated as SimplifyDeep<
          DataBefore<Phase["order"], Phase["steps"], typeof step>
        >,

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
      status: "completed",
      data: accumulated as SimplifyDeep<AllPhaseData<Phase>>,
    };
  };
}
