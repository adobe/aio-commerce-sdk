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
  findExistingSubscription,
  generateInstanceId,
  getIoEventCode,
  getRegistrationDescription,
  getRegistrationName,
  groupEventsByRuntimeActions,
} from "./utils";

import type { CommerceEventSubscription } from "@adobe/aio-commerce-lib-events/commerce";
import type {
  EventProviderType,
  IoEventMetadata,
  IoEventProvider,
  IoEventRegistration,
} from "@adobe/aio-commerce-lib-events/io-events";
import type { CommerceEvent, ExternalEvent } from "#config/schema/eventing";
import type { ApplicationMetadata } from "#config/schema/metadata";
import type {
  CreateOrGetSubscriptionParams,
  CreateProviderEventsMetadataParams,
  CreateProviderParams,
  CreateRegistrationParams,
  OnboardCommerceEventSubscriptionParams,
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
  const { appCredentials, logger } = context;

  // Check if a registration already exists for this provider and runtime action.
  const name = getRegistrationName(provider, runtimeAction);
  const existing = findExistingRegistrations(
    registrations,
    appCredentials.clientId,
    name,
  );

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

/**
 * Creates or retrieves an existing Commerce event subscription.
 * @param params - Parameters needed to create or get the subscription.
 * @param existingData - Map of existing Commerce subscriptions keyed by event name.
 */
async function createOrGetSubscription(
  params: CreateOrGetSubscriptionParams,
  existingData: Map<string, CommerceEventSubscription>,
) {
  const { context, metadata, provider, event } = params;
  const { logger, commerceEventsClient } = context;
  const eventName = getNamespacedEvent(metadata, event.config.name);

  const existing = findExistingSubscription(existingData, eventName);
  if (existing) {
    logger.info(
      `Subscription for event "${event.config.name}" already exists, skipping creation.`,
    );
    return {
      name: existing.name,
      parent: existing.parent,
      fields: existing.fields,
      providerId: existing.provider_id,
    };
  }

  const eventSpec = {
    name: eventName,
    parent: event.config.name,
    fields: event.config.fields.map((field) => ({ name: field })),
    providerId: provider.instance_id,
  };

  return commerceEventsClient
    .createEventSubscription(eventSpec)
    .then((_res) => {
      logger.info(
        `Created event subscription for event "${event.config.name}" to provider "${provider.label} (instance ID: ${provider.instance_id})"`,
      );
      return eventSpec;
    })
    .catch((err) => {
      logger.error(
        `Failed to create event subscription for event "${event.config.name}" to provider "${provider.label}": ${stringifyError(err)}`,
      );

      throw err;
    });
}

/**
 * Onboards a single event source to I/O Events by creating/retrieving the provider and its event metadata.
 * This is the shared logic inside the loop for both commerce and external event installation steps.
 *
 * @param params - Configuration for onboarding a single event source
 * @param existingData - Existing I/O Events data
 */
export async function onboardIoEvents<
  EventType extends CommerceEvent | ExternalEvent,
>(
  params: OnboardIoEventsParams<EventType>,
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

  const actionEventsMap = groupEventsByRuntimeActions(events);
  const registrationPromises = Array.from(actionEventsMap.entries()).map(
    ([runtimeAction, groupedEvents]) =>
      createOrGetEventRegistration(
        {
          context,
          events: groupedEvents,
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
  // Each event can have multiple registrations (one per runtime action)
  const eventsData = events.map((event, index) => {
    const eventRegistrations = event.runtimeActions.map((runtimeAction) => {
      const registrationIndex = Array.from(actionEventsMap.keys()).indexOf(
        runtimeAction,
      );
      return registrationsData[registrationIndex];
    });

    return {
      config: { ...event, providerType },
      data: {
        metadata: metadataData[index],
        registrations: eventRegistrations,
      },
    };
  });

  return {
    providerData,
    eventsData,
  };
}

/**
 * Onboards Commerce event subscriptions by creating or updating them based on existing subscriptions.
 * @param params - The parameters necessary to onboard Commerce event subscriptions.
 */
export async function onboardCommerce(
  params: OnboardCommerceEventSubscriptionParams,
) {
  const { context, metadata, data } = params;
  const { logger, commerceEventsClient } = context;
  const { events, ...providerData } = data;

  const instanceId = providerData.instance_id;

  logger.info(
    `Onboarding Commerce event subscriptions with provider instance ID: ${instanceId}`,
  );

  const existingSubscriptions =
    await commerceEventsClient.getAllEventSubscriptions();
  const existingSubscriptionsMap = new Map(
    existingSubscriptions.map((subscription) => [
      subscription.name,
      subscription,
    ]),
  );

  const subscriptionsPromises = events.map((event) =>
    createOrGetSubscription(
      {
        context,
        metadata,
        provider: providerData,
        event,
      },
      existingSubscriptionsMap,
    ),
  );

  return Promise.all(subscriptionsPromises);
}

/**
 * Generates a namespaced event name by combining the application ID with the event name.
 * @param metadata
 * @param name
 */
function getNamespacedEvent(metadata: ApplicationMetadata, name: string) {
  return `${metadata.id}.${name}`;
}

/**
 * Creates a fully qualified event name for Adobe Commerce events.
 * @param appId - The application ID
 * @param event - The Commerce event
 */
export function getEventName(appId: string, event: CommerceEvent) {
  return `com.adobe.commerce.${appId}.${event.name}`;
}
