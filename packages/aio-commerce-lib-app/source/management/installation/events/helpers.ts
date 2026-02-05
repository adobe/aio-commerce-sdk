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

import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";

import {
  findExistingProvider,
  findExistingProviderMetadata,
  findExistingRegistrations,
  generateInstanceId,
  getIoEventCode,
  getRegistrationDescription,
  getRegistrationName,
} from "./utils";

import type {
  EventProviderType,
  IoEventMetadata,
  IoEventProvider,
  IoEventRegistration,
} from "@adobe/aio-commerce-lib-events/io-events";
import type {
  CreateProviderEventsMetadataParams,
  CreateProviderParams,
  CreateRegistrationParams,
  OnboardIoEventsParams,
} from "./types";
import type { EventsExecutionContext, ExistingIoEventsData } from "./utils";

/**
 * Creates an event provider if it does not already exist.
 * @param params - The parameters necessary to create the provider.
 */
export async function createProvider(params: CreateProviderParams) {
  const { context, provider } = params;
  const { appCredentials, ioEventsClient, logger } = context;

  logger.info(
    `Creating provider '${provider.label}' with instance ID '${provider.instanceId}'`,
  );

  return ioEventsClient
    .createEventProvider({
      ...appCredentials,

      label: provider.label,
      providerType: provider.type,
      instanceId: provider.instanceId,
      description: provider.description,
    })
    .then((res) => {
      logger.info(`Provider "${provider.label}" created with ID '${res.id}'`);
      return res;
    })
    .catch((error) => {
      logger.error(
        `Failed to create provider "${provider.label}": ${stringifyError(error)}`,
      );

      throw error;
    });
}

/**
 * Creates or retrieves an existing I/O Events provider.
 * @param params - Parameters needed to create or get the provider.
 * @param existingData - Existing I/O Events data.
 */
export async function createOrGetProvider(
  params: CreateProviderParams,
  existingData: IoEventProvider[],
) {
  const { context, provider } = params;
  const { logger } = context;
  const { instanceId, ...providerData } = provider;

  const existing = findExistingProvider(existingData, instanceId);
  if (existing) {
    logger.info(
      `Provider '${provider.label}' already exists with ID '${existing.id}', skipping creation.`,
    );

    return existing;
  }

  return createProvider({
    context,
    provider: {
      ...providerData,
      instanceId,
    },
  });
}

/**
 * Creates an event metadata for a given provider and event.
 * @param params - The parameters necessary to create the event metadata.
 */
export async function createMetadata(
  params: CreateProviderEventsMetadataParams,
) {
  const { context, event, provider, type } = params;
  const { appCredentials, ioEventsClient, logger } = context;

  const eventCode = getIoEventCode(event.name, type);
  logger.info(
    `Creating event metadata (${eventCode}) for provider "${provider.label}" (instance ID: ${provider.instance_id}))`,
  );

  return ioEventsClient
    .createEventMetadataForProvider({
      ...appCredentials,
      providerId: provider.id,

      label: event.label,
      description: event.description,
      eventCode,
    })
    .then((res) => {
      logger.info(
        `Event metadata "${event.label}" created for provider "${provider.label}"`,
      );

      return res;
    })
    .catch((error) => {
      logger.error(
        `Failed to create event metadata "${event.label}" for provider "${provider.label}": ${stringifyError(error)}`,
      );

      throw error;
    });
}

/**
 * Creates or retrieves existing I/O Events metadata for a given provider and event.
 * @param params - The parameters necessary to create or get the event metadata.
 * @param existingData - Existing I/O Events metadata for the provider.
 */
export async function createOrGetIoProviderEventMetadata(
  params: CreateProviderEventsMetadataParams,
  existingData: IoEventMetadata[],
) {
  const { context, event, provider, type } = params;
  const { logger } = context;

  const eventCode = getIoEventCode(event.name, type);
  const existing = findExistingProviderMetadata(existingData, eventCode);
  if (existing) {
    logger.info(
      `Event metadata "${event.label}" already exists for provider "${provider.label}" (instance ID: ${provider.instance_id}), skipping creation.`,
    );

    return existing;
  }

  return createMetadata(params);
}

/**
 * Creates an event registration bound to the given provider ID for a set of events targeting the given runtime action.
 * @param params - The parameters necessary to create the registration.
 */
export async function createRegistration(params: CreateRegistrationParams) {
  const { context, events, provider, runtimeAction } = params;
  const { appCredentials, ioEventsClient, logger } = context;

  logger.info(
    `Creating registration(s) to runtime action "${runtimeAction}" for ${events.length} event(s) with provider "${provider.label}" (instance ID: ${provider.instance_id}))`,
  );

  const name = getRegistrationName(provider, runtimeAction);
  const description = getRegistrationDescription(
    provider,
    events,
    runtimeAction,
  );

  return ioEventsClient
    .createRegistration({
      ...appCredentials,
      clientId: "",

      name,
      description,
      deliveryType: "webhook",
      runtimeAction,

      enabled: true,
      eventsOfInterest: events.map((event) => ({
        providerId: provider.id,
        eventCode: getIoEventCode(
          event.name,
          provider.provider_metadata as EventProviderType,
        ),
      })),
    })
    .then((res) => {
      logger.info(
        `Registration "${name}" created for provider "${provider.label}" with ID '${res.id}'`,
      );

      return res;
    })
    .catch((error) => {
      logger.error(
        `Failed to create registration "${name}" for provider "${provider.label}": ${stringifyError(error)}`,
      );

      throw error;
    });
}

/**
 * Creates or retrieves an existing I/O Events registration.
 * @param params - Parameters needed to create or get the registration.
 * @param existingData - Existing I/O Events data.
 */
export async function createOrGetEventRegistration(
  params: CreateRegistrationParams,
  registrations: IoEventRegistration[],
) {
  const { context, provider, runtimeAction } = params;
  const { logger } = context;

  // Check if a registration already exists for this provider and runtime action.
  const name = getRegistrationName(provider, runtimeAction);
  const existing = findExistingRegistrations(registrations, "", name);

  if (existing) {
    logger.info(
      `Registration "${name}" already exists for provider "${provider.label}" with ID '${existing.id}', skipping creation.`,
    );

    return existing;
  }

  return createRegistration(params);
}

export function configureCommerce(context: EventsExecutionContext) {
  const { logger } = context;
  logger.info("Configuring Commerce Eventing");

  return { commerceConfigured: true };
}

export function createCommerceSubscriptions(context: EventsExecutionContext) {
  const { logger } = context;
  logger.info("Creating event subscriptions in Commerce");

  return [{ subscriptionId: "TODO" }];
}

/**
 * Onboards a single event source to I/O Events by creating/retrieving the provider and its event metadata.
 * This is the shared logic inside the loop for both commerce and external event installation steps.
 *
 * @param params - Configuration for onboarding a single event source
 * @param existingData - Existing I/O Events data
 */
export async function onboardIoEvents(
  params: OnboardIoEventsParams,
  existingData: ExistingIoEventsData,
) {
  const { providersWithMetadata, registrations } = existingData;
  const { context, metadata, provider, providerType, events } = params;

  const instanceId = generateInstanceId(metadata, provider);
  const providerData = await createOrGetProvider(
    {
      context,
      provider: {
        ...provider,
        instanceId,
        type: providerType,
      },
    },
    providersWithMetadata,
  );

  const metadataPromises = events.map((event) =>
    createOrGetIoProviderEventMetadata(
      {
        context,
        type: providerType,
        provider: providerData,
        event,
      },

      // Retrieve the existing metadata for this provider, if any.
      providersWithMetadata.find((p) => p.id === providerData.id)?.metadata ??
        [],
    ),
  );

  // We want to create a single registration if many events target the same runtime action.
  const actionEvents = Object.groupBy(events, (event) => event.runtimeAction);
  const registrationPromises = Object.entries(actionEvents).map(
    ([runtimeAction, groupedEvents]) =>
      createOrGetEventRegistration(
        {
          context,
          events: groupedEvents ?? [],
          provider: providerData,
          runtimeAction,
        },
        registrations,
      ),
  );

  const [metadataData, registrationsData] = await Promise.all([
    Promise.all(metadataPromises),
    Promise.all(registrationPromises),
  ]);

  // Map events to their registrations
  const eventsData = events.map((event, index) => {
    const registrationIndex = Object.keys(actionEvents).indexOf(
      event.runtimeAction,
    );

    return {
      config: event,
      data: {
        metadata: metadataData[index],
        registration: registrationsData[registrationIndex],
      },
    };
  });

  return {
    providerData,
    eventsData,
  };
}
