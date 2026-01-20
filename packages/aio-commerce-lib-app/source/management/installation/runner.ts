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

import type { Simplify } from "type-fest";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  AllPhaseData,
  InstallationPhase,
  InstallationPhases,
  PhaseExecutors,
  StepResult,
} from "./types";

/** Union of all possible step failures for a phase */
type PhaseFailure<Phase extends InstallationPhase> = {
  [S in InstallationPhases[Phase]["order"][number]]: {
    status: "failed";
    step: S;
    error: InstallationPhases[Phase]["steps"][S]["errors"];
  };
}[InstallationPhases[Phase]["order"][number]];

/** Result of running a phase */
export type PhaseResult<P extends InstallationPhase> =
  | { status: "completed"; data: Simplify<AllPhaseData<InstallationPhases[P]>> }
  | PhaseFailure<P>;

/**
 * Defines a phase with its order and executors.
 * @param phase - The phase identifier.
 * @param order - The order of steps in the phase.
 * @param executors - The executors for each step in the phase.
 */
export function definePhase<Phase extends InstallationPhase>(
  phase: Phase,
  order: InstallationPhases[Phase]["order"],
  executors: PhaseExecutors<Phase>,
) {
  return async (
    config: CommerceAppConfigOutputModel,
  ): Promise<PhaseResult<Phase>> => {
    let accumulated = {};

    for (const step of order) {
      const executor = executors[step as keyof typeof executors];
      let result: StepResult<Phase, typeof step>;

      try {
        result = await executor(config, {
          phase,
          step,

          data: accumulated,
          helpers: {
            stepFailed: (key, errorPayload) => {
              return {
                success: false as const,
                error: { key, error: errorPayload },
              };
            },

            stepSuccess: <T>(data: T) => {
              return {
                success: true as const,
                data,
              };
            },
          },
        });
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
        accumulated = { ...accumulated, ...result.data };
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
      data: accumulated as Simplify<AllPhaseData<InstallationPhases[Phase]>>,
    };
  };
}
