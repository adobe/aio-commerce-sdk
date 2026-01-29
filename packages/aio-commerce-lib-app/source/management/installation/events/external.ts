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

import { createMetadata, createProviders, createRegistrations } from "./steps";

import type { SetRequiredDeep } from "type-fest";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { InferStepOutput } from "#management/installation/workflow/step";
import type { EventsConfig, EventsExecutionContext } from "./utils";

/** Config type when external event sources are present. */
export type ExternalEventsConfig = SetRequiredDeep<
  EventsConfig,
  "eventing.external"
>;

/** Check if config has external event sources. */
export function hasExternalEvents(
  config: CommerceAppConfigOutputModel,
): config is ExternalEventsConfig {
  return (
    Array.isArray(config?.eventing?.external) &&
    config.eventing.external.length > 0
  );
}

/** Leaf step for installing external event sources. */
export const externalEventsStep = defineLeafStep({
  name: "external",
  meta: {
    label: "External Events",
    description: "Sets up I/O Events for external event sources",
  },

  when: hasExternalEvents,
  run: (config, context: EventsExecutionContext) => {
    const { logger } = context;
    logger.debug(config);

    const externalEventSources = config.eventing.external;
    const configProviders = externalEventSources.map((c) => c.provider);

    const providers = createProviders(context, configProviders);
    const metadata = createMetadata(context);
    const registrations = createRegistrations(context);

    return { providers, metadata, registrations };
  },
});

/** The output data of the Commerce Eventing step (auto-inferred). */
export type ExternalEventsStepData = InferStepOutput<typeof externalEventsStep>;
