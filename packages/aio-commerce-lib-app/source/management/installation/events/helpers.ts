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
  COMMERCE_PROVIDER_TYPE,
  findExistingProvider,
  findExistingProviderMetadata,
  generateInstanceId,
} from "./utils";

import type {
  IoEventMetadata,
  IoEventProvider,
} from "@adobe/aio-commerce-lib-events/io-events";
import type { CommerceEvent, ExternalEvent } from "#config/schema/eventing";
import type { ApplicationMetadata } from "#config/schema/metadata";
import type {
  CreateProviderEventsMetadataParams,
  CreateProviderParams,
  CreateSubscriptionParams,
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
    .createEventProvider(
      {
        ...appCredentials,

        label: provider.label,
        providerType: provider.type,
        instanceId: provider.instanceId,
        description: provider.description,
      },
      {
        timeout: 1000 * 60 * 5, // 5 minutes
      },
    )
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
 * Creates or retrieves an existing I/O Events provider for Adobe Commerce.
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
  const { context } = params;
  const { appCredentials, ioEventsClient, logger } = context;

  const eventCode =
    params.type === COMMERCE_PROVIDER_TYPE
      ? `com.adobe.commerce.${params.event.name}`
      : params.event.name;

  const { provider, event } = params;
  logger.info(
    `Creating event metadata (${eventCode}) for provider "${provider.label}" (instance ID: ${provider.instance_id}))`,
  );

  return ioEventsClient
    .createEventMetadataForProvider(
      {
        ...appCredentials,
        providerId: provider.id,

        label: event.label,
        description: event.description,
        eventCode,
      },
      {
        timeout: 1000 * 60 * 5, // 5 minutes
      },
    )
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
  const { context, provider, event } = params;
  const { logger } = context;

  // Generate the full event code to search for existing metadata
  const eventCode =
    params.type === COMMERCE_PROVIDER_TYPE
      ? `com.adobe.commerce.${event.name}`
      : event.name;

  const existing = findExistingProviderMetadata(existingData, eventCode);
  if (existing) {
    logger.info(
      `Event metadata "${event.label}" already exists for provider "${provider.label}" (instance ID: ${provider.instance_id}), skipping creation.`,
    );

    return existing;
  }

  return createMetadata(params);
}

export function createRegistrations(context: EventsExecutionContext) {
  const { logger } = context;
  logger.info("Creating event registrations");

  return [{ registrationId: "TODO" }];
}

export function configureCommerce(context: EventsExecutionContext) {
  const { logger } = context;
  logger.info("Configuring Commerce Eventing");

  return { commerceConfigured: true };
}

/**
 * Creates a Commerce event subscription based on existing subscriptions.
 * @param params
 */
export async function createSubscription(params: CreateSubscriptionParams) {
  const { context, metadata, provider, event } = params;
  const { logger, commerceEventsClient } = context;
  const eventSpec = {
    name: getNamespacedEvent(metadata, event.config.name),
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
  const { providersWithMetadata } = existingData;
  const { context, metadata, provider, events, providerType } = params;

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

  const existingProviderMetadata =
    providersWithMetadata.find((p) => p.id === providerData.id)?.metadata ?? [];

  const eventPromises = events.map(async (event) => {
    const metadata = await createOrGetIoProviderEventMetadata(
      {
        context,
        type: providerType,
        provider: providerData,
        event,
      },
      existingProviderMetadata,
    );

    return {
      config: { ...event, providerType },
      data: {
        metadata,
      },
    };
  });

  const eventsData = await Promise.all(eventPromises);
  return {
    providerData,
    eventsData,
  };
}

/**
 * Onboards Commerce event subscriptions by creating or updating them based on existing subscriptions.
 * @param params
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

  const existingSubscriptionsMap = new Map(
    (await commerceEventsClient.getAllEventSubscriptions()).map(
      (subscription) => [subscription.name, subscription],
    ),
  );

  const eventsToCreate = events.filter((event) => {
    const eventName = getNamespacedEvent(metadata, event.config.name);
    const exists = existingSubscriptionsMap.has(eventName);

    if (exists) {
      logger.info(
        `Subscription already exists for event: ${eventName}, skipping creation`,
      );
    }

    return !exists;
  });

  logger.info(
    `Creating ${eventsToCreate.length} new subscriptions (${events.length - eventsToCreate.length} already exist)`,
  );

  const subscriptionsPromises = eventsToCreate.map((event) =>
    createSubscription({
      context,
      metadata,
      provider: providerData,
      event,
    }),
  );

  return {
    subscriptionsData: await Promise.all(subscriptionsPromises),
  };
}

/**
 * Generates a namespaced event name by combining the application ID with the event name.
 * @param metadata
 * @param name
 */
function getNamespacedEvent(metadata: ApplicationMetadata, name: string) {
  return `${metadata.id}.${name}`;
}
