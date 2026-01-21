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

import { eventsPhaseRunner } from "./phases/events";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { InstallationContext } from "#management/installation/types";

// import { webhooksPhaseRunner } from "./phases/webhooks";

const phaseRunners = [
  { name: "events", run: eventsPhaseRunner },
  // { name: "webhooks", run: webhooksPhaseRunner },
] as const;

/** Result of a successful installation. */
export type InstallationSuccess = { status: "succeeded" };

/** Result of a failed installation. */
export type InstallationFailure = {
  status: "failed";
  phase: string;
  step: string;
  error: unknown;
};

/** Result of running the installation. */
export type InstallationResult = InstallationSuccess | InstallationFailure;

/**
 * Runs all installation phases sequentially.
 * @param config - The commerce app configuration.
 * @param context - The shared installation context (API clients, logger, etc.).
 * @returns The result of the installation.
 */
export async function runInstallation(
  config: CommerceAppConfigOutputModel,
  context: InstallationContext,
): Promise<InstallationResult> {
  for (const { name, run } of phaseRunners) {
    const result = await run(config, context);

    if (result.status === "failed") {
      return {
        status: "failed",
        phase: name,
        step: result.step,
        error: result.error,
      };
    }
  }

  return { status: "succeeded" };
}
