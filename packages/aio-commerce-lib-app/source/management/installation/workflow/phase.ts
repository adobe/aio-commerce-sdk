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

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  ErrorDefinitions,
  InstallationContext,
  PhaseMeta,
  PhasePlan,
  StepDefinition,
} from "./types";

/**
 * A phase definition for the installation workflow.
 *
 * @example
 * const eventsPhase: PhaseDefinition<EventsConfig, EventsContext, EventsErrors> = {
 *   name: "events",
 *   meta: { label: "Events", description: "Sets up eventing" },
 *   when: hasEventSources,
 *   context: (installation) => ({
 *     ioEventsClient: createIoEventsClient(installation.params),
 *   }),
 *   planSteps: (config) => [...],
 *   async handler(config, installation, plan) {
 *     let p = plan;
 *     p = await p.run("step1", (cfg, { phaseContext, helpers }) => {
 *       phaseContext.ioEventsClient.doSomething();
 *       return helpers.success({ foo: 1 });
 *     });
 *     return p;
 *   },
 * };
 */
export type PhaseDefinition<
  TConfig extends CommerceAppConfigOutputModel = CommerceAppConfigOutputModel,
  TPhaseCtx = unknown,
  TErrorDefs extends ErrorDefinitions = ErrorDefinitions,
> = {
  name: string;
  meta: PhaseMeta;
  when: (config: CommerceAppConfigOutputModel) => config is TConfig;

  /** Optional factory to create phase-specific context (API clients, etc.). */
  context?: (
    installation: InstallationContext,
  ) => TPhaseCtx | Promise<TPhaseCtx>;

  planSteps: (config: TConfig) => StepDefinition[];
  handler: (
    config: TConfig,
    installation: InstallationContext,
    plan: PhasePlan<TConfig, Record<string, never>, TPhaseCtx, TErrorDefs>,
  ) => Promise<PhasePlan<TConfig, unknown, TPhaseCtx, TErrorDefs>>;
};

/** Infer the output data of the given phase. */
export type InferPhaseData<TPhase> =
  TPhase extends PhaseDefinition<
    infer _TConfig,
    infer _TPhaseCtx,
    infer _TErrorDefs
  >
    ? ReturnType<TPhase["handler"]> extends Promise<
        PhasePlan<
          infer _TConfig,
          infer TData,
          infer _TPhaseCtx,
          infer _TErrorDefs
        >
      >
      ? TData
      : never
    : never;
