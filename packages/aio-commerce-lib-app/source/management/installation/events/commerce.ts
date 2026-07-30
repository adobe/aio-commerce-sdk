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
import { hasCommerceEvents } from "#config/schema/eventing";
import { defineLeafStep } from "#management/installation/workflow/step";

import {
  configureCommerceEventing,
  offboardCommerceEventing,
  offboardIoEvents,
  onboardCommerceEventing,
  onboardIoEvents,
} from "./helpers";
import {
  COMMERCE_PROVIDER_TYPE,
  EVENTS_STORAGE_KEY,
  getCommerceEventingExistingData,
  getIoEventsExistingData,
  makeWorkspaceConfig,
  removeStoredEventProviders,
  sanitizeEventingIdentifier,
} from "./utils";

import type { CommerceEventsConfig } from "#config/schema/eventing";
import type { InferStepOutput } from "#management/installation/workflow/step";
import type { EventsExecutionContext } from "./context";
import type { StoredEventsData } from "./types";

/** The output data of the Commerce Eventing step (auto-inferred). */
export type CommerceEventsStepData = InferStepOutput<typeof commerceEventsStep>;

/** Leaf step for installing commerce event sources. */
export const commerceEventsStep = defineLeafStep({
  install: createCommerceEvents,
  meta: {
    install: {
      description: "Sets up I/O Events for Adobe Commerce event sources",
      label: "Configure Commerce Events",
    },
    uninstall: {
      description: "Removes I/O Events for Adobe Commerce event sources",
      label: "Remove Commerce Events",
    },
  },
  name: "commerce",
  uninstall: removeCommerceEvents,

  when: hasCommerceEvents,
});

/**
 * Creates all needed entities for Eventing to work with Commerce and Adobe I/O Events.
 * @param config - The configuration of the app, with commerce events.
 * @param context - The execution context for the events installation.
 */
async function createCommerceEvents(
  config: CommerceEventsConfig,
  context: EventsExecutionContext,
) {
  const { logger } = context;
  logger.debug("Starting installation of Commerce Events with config:", config);

  // biome-ignore lint/suspicious/noEvolvingTypes: We want the type to be auto-inferred
  const stepData = [];

  const env = getInstallCommerceEnv(context.params);
  const workspaceConfiguration = JSON.stringify(makeWorkspaceConfig(context));
  const existingIoEventsData = await getIoEventsExistingData(context);
  const commerceEventingExistingData =
    await getCommerceEventingExistingData(context);

  // Decoupled from the loop index: a provider whose events are all scoped to
  // another environment is skipped, so the one-time eventing-module configuration
  // runs on the first provider that is actually onboarded.
  let eventingConfigured = false;
  const storedProviders: StoredEventsData["providers"] = {};

  for (const { provider, events: providerEvents } of config.eventing.commerce) {
    const events = providerEvents.filter((event) => appliesToEnv(event, env));
    if (events.length === 0) {
      logger.debug(
        `Skipping Commerce event provider "${provider.label}": no events apply to environment "${env}".`,
      );
      continue;
    }

    // biome-ignore lint/performance/noAwaitInLoops: providers must be onboarded sequentially so the one-time eventing-module configuration (see `eventingConfigured` below) runs against the first onboarded provider's data
    const { providerData, eventsData } = await onboardIoEvents(
      {
        context,
        events,
        metadata: config.metadata,
        provider,
        providerType: COMMERCE_PROVIDER_TYPE,
      },
      existingIoEventsData,
    );

    if (!eventingConfigured) {
      // The eventing module must be configured before creating the other entities, and only once.
      await configureCommerceEventing(
        {
          config: {
            enabled: true,
            environment_id: sanitizeEventingIdentifier(
              context.appData.projectName,
            ),
            instance_id: providerData.instance_id,
            merchant_id: sanitizeEventingIdentifier(context.appData.orgName),
            workspace_configuration: workspaceConfiguration,
          },
          context,
        },
        commerceEventingExistingData,
      );
      eventingConfigured = true;
    }

    const { commerceProvider, subscriptions } = await onboardCommerceEventing(
      {
        context,
        ioData: {
          events: eventsData,
          provider: providerData,
          workspaceConfiguration,
        },
        metadata: config.metadata,
        provider,
      },
      commerceEventingExistingData,
    );

    stepData.push({
      provider: {
        config: provider,
        data: {
          commerce: commerceProvider,
          events: eventsData.map(({ config: eventConfig, data }, index) => ({
            config: eventConfig,
            data: {
              ...data,
              subscription: subscriptions[index],
            },
          })),
          ioEvents: providerData,
        },
      },
    });

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
  }

  const existing = (await getSystemConfigByKey<StoredEventsData>(
    EVENTS_STORAGE_KEY,
  )) ?? {
    providers: {},
  };
  await setSystemConfigByKey(EVENTS_STORAGE_KEY, {
    providers: { ...existing.providers, ...storedProviders },
  });

  logger.debug("Completed Commerce Events installation step.");
  return stepData;
}

/**
 * Remove all created for Commerce eventing created durint installation
 * @param config - The configuration of the app, with commerce events.
 * @param context - The execution context for the events installation.
 */
async function removeCommerceEvents(
  config: CommerceEventsConfig,
  context: EventsExecutionContext,
) {
  const { logger } = context;
  logger.debug("Starting uninstall of Commerce Events with config:", config);

  const [existingIoEventsData, commerceEventingExistingData] =
    await Promise.all([
      getIoEventsExistingData(context),
      getCommerceEventingExistingData(context),
    ]);

  for (const { provider, events } of config.eventing.commerce) {
    // biome-ignore lint/performance/noAwaitInLoops: each provider issues two external API calls (Commerce eventing + I/O Events); running providers sequentially avoids a rate-limit burst during uninstall
    await offboardCommerceEventing(
      { context, events, metadata: config.metadata, provider },
      commerceEventingExistingData,
    );

    await offboardIoEvents(
      { context, events, metadata: config.metadata, provider },
      existingIoEventsData,
    );
  }

  await removeStoredEventProviders(
    config.eventing.commerce
      .map(({ provider }) => provider.key)
      .filter((key): key is string => typeof key === "string"),
  );

  logger.debug("Completed Commerce Events uninstall step.");
}
