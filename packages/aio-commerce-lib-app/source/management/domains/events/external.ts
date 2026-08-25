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
import { defineLeafStep } from "#management/common/workflow/step";

import { applyEventingLeaf } from "./apply";
import { offboardIoEvents, onboardIoEvents } from "./helpers";
import { planExternalEvents } from "./plan";
import {
  EVENTS_STORAGE_KEY,
  EXTERNAL_PROVIDER_TYPE,
  getIoEventsExistingData,
  removeStoredEventProviders,
} from "./utils";

import type { ExternalEventsConfig } from "#config/schema/eventing";
import type {
  ApplyContext,
  ApplyResult,
} from "#management/common/workflow/resource";
import type { InferStepOutput } from "#management/common/workflow/step";
import type { EventsExecutionContext, EventsStepContext } from "./context";
import type {
  EventingDomainPlan,
  EventingSnapshotData,
  StoredEventsData,
} from "./types";

/** The output data of the External Eventing step (auto-inferred). */
export type ExternalEventsStepData = InferStepOutput<typeof externalEventsStep>;

/** Leaf step for installing and upgrading external event sources. */
export const externalEventsStep = defineLeafStep({
  apply: applyExternalEvents,
  install: createExternalEvents,

  isConfigured: hasExternalEvents,
  meta: {
    install: {
      description: "Sets up I/O Events for external event sources",
      label: "Configure External Events",
    },
    uninstall: {
      description: "Removes I/O Events for external event sources",
      label: "Remove External Events",
    },
    upgrade: {
      description:
        "Reconciles external event providers, metadata and registrations",
      label: "Update External Events",
    },
  },
  name: "external",
  plan: planExternalEvents,
  uninstall: removeExternalEvents,
});

/**
 * Applies an external eventing domain plan by delegating to the shared leaf convergence, supplying this
 * leaf's own `install`/`uninstall` handlers. Defined here (not in `./apply`) so that `applyEventingLeaf`
 * stays free of any dependency on this step — attaching it there would form an import cycle.
 *
 * @param plan - The eventing domain plan produced by `planExternalEvents`.
 * @param context - The attempt-scoped execution context.
 */
export function applyExternalEvents(
  plan: EventingDomainPlan,
  context: ApplyContext<EventsStepContext>,
): Promise<ApplyResult<EventingSnapshotData>> {
  return applyEventingLeaf(plan, context, {
    install: async (config, ctx) =>
      await externalEventsStep.install(config as ExternalEventsConfig, ctx),
    isCommerce: false,
    type: EXTERNAL_PROVIDER_TYPE,
    uninstall: async (config, ctx) => {
      await externalEventsStep.uninstall?.(config as ExternalEventsConfig, ctx);
    },
  });
}

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
