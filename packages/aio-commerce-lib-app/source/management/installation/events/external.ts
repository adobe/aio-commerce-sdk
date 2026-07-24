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

import {
  getSystemConfigByKey,
  setSystemConfigByKey,
} from "@adobe/aio-commerce-lib-config";

import { appliesToEnv, getInstallCommerceEnv } from "#config/lib/environment";
import { hasExternalEvents } from "#config/schema/eventing";
import { defineLeafStep } from "#management/installation/workflow/step";

import { offboardIoEvents, onboardIoEvents } from "./helpers";
import {
  EVENTS_STORAGE_KEY,
  EXTERNAL_PROVIDER_TYPE,
  getIoEventsExistingData,
  removeStoredEventProviders,
} from "./utils";

import type { ExternalEventsConfig } from "#config/schema/eventing";
import type { InferStepOutput } from "#management/installation/workflow/step";
import type { EventsExecutionContext } from "./context";
import type { StoredEventsData } from "./types";

/** The output data of the External Eventing step (auto-inferred). */
export type ExternalEventsStepData = InferStepOutput<typeof externalEventsStep>;

/** Leaf step for installing external event sources. */
export const externalEventsStep = defineLeafStep({
  install: createExternalEvents,
  meta: {
    install: {
      description: "Sets up I/O Events for external event sources",
      label: "Configure External Events",
    },
    uninstall: {
      description: "Removes I/O Events for external event sources",
      label: "Remove External Events",
    },
  },
  name: "external",
  uninstall: removeExternalEvents,

  when: hasExternalEvents,
});

/**
 * Creates all needed entities for External Events to work with Adobe I/O Events.
 * @param config - The configuration of the app, with external events.
 * @param context - The execution context for the events installation.
 */
async function createExternalEvents(
  config: ExternalEventsConfig,
  context: EventsExecutionContext,
) {
  const { logger } = context;
  logger.debug("Starting installation of External Events with config:", config);

  const env = getInstallCommerceEnv(context.params);
  const existingIoEventsData = await getIoEventsExistingData(context);
  const storedProviders: StoredEventsData["providers"] = {};

  const eligibleProviders = config.eventing.external
    .map(({ provider, events: providerEvents }) => ({
      events: providerEvents.filter((event) => appliesToEnv(event, env)),
      provider,
    }))
    .filter(({ events, provider }) => {
      if (events.length === 0) {
        logger.debug(
          `Skipping external event provider "${provider.label}": no events apply to environment "${env}".`,
        );
      }

      return events.length > 0;
    });

  const stepData = await Promise.all(
    eligibleProviders.map(async ({ provider, events }) => {
      const { providerData, eventsData } = await onboardIoEvents(
        {
          context,
          events,
          metadata: config.metadata,
          provider,
          providerType: EXTERNAL_PROVIDER_TYPE,
        },
        existingIoEventsData,
      );

      if (provider.key) {
        storedProviders[provider.key] = {
          events: Object.fromEntries(
            eventsData.map(({ config: eventConfig, data: eventData }) => [
              eventConfig.name,
              {
                code: eventData.metadata.event_code,
                isPhiData: eventConfig.hipaa_audit_required ?? false,
              },
            ]),
          ),
          id: providerData.id,
        };
      }

      return {
        provider: {
          config: provider,
          data: {
            events: {
              config: events,
              data: eventsData,
            },
            ioEvents: providerData,
          },
        },
      };
    }),
  );

  const existing = (await getSystemConfigByKey<StoredEventsData>(
    EVENTS_STORAGE_KEY,
  )) ?? {
    providers: {},
  };
  await setSystemConfigByKey(EVENTS_STORAGE_KEY, {
    providers: { ...existing.providers, ...storedProviders },
  });

  logger.debug("Completed External Events installation step.");
  return stepData;
}

/**
 * Removed all created entities for External Events during the installation
 * @param config - The configuration of the app, with external events.
 * @param context - The execution context for the events installation.
 */
async function removeExternalEvents(
  config: ExternalEventsConfig,
  context: EventsExecutionContext,
) {
  const { logger } = context;
  logger.debug("Starting uninstall of External Events with config:", config);

  const existingIoEventsData = await getIoEventsExistingData(context);

  for (const { provider, events } of config.eventing.external) {
    // biome-ignore lint/performance/noAwaitInLoops: offboards hit the Adobe I/O Events API sequentially to avoid a rate-limit burst during uninstall
    await offboardIoEvents(
      { context, events, metadata: config.metadata, provider },
      existingIoEventsData,
    );
  }

  await removeStoredEventProviders(
    config.eventing.external
      .map(({ provider }) => provider.key)
      .filter((key): key is string => typeof key === "string"),
  );

  logger.debug("Completed External Events uninstall step.");
}
