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

import { unwrapHttpError } from "@adobe/aio-commerce-lib-api/utils";
import { resolveImsAuthParams } from "@adobe/aio-commerce-lib-auth";
import { inspect } from "@aio-commerce-sdk/common-utils/logging";

import { throwHttpError } from "#management/common/utils/http-error";
import { restoreEventMetadataText } from "#management/domains/events/api";
import {
  generateInstanceId,
  generateInstanceIdDeprecated,
  getIoEventCode,
  getLegacyRegistrationName,
  getNamespacedEvent,
  getRegistrationDescription,
  getRegistrationName,
  groupEventsByRuntimeActions,
} from "#management/domains/events/utils";

import type {
  CommerceEventProvider,
  CommerceEventSubscription,
  EventSubscriptionCreateParams,
} from "@adobe/aio-commerce-lib-events/commerce";
import type {
  EventProviderType,
  IoEventMetadata,
  IoEventProvider,
  IoEventRegistration,
} from "@adobe/aio-commerce-lib-events/io-events";
import type { ArrayElement } from "type-fest";
import type {
  AppEvent,
  CommerceEvent,
  EventProvider,
} from "#config/schema/eventing";
import type { ApplicationMetadata } from "#config/schema/metadata";
import type { EventsExecutionContext } from "#management/domains/events/context";
import type { AppEventWithoutRuntimeActions } from "#management/domains/events/types";
import type {
  ExistingCommerceEventingData,
  ExistingIoEventsData,
  IoEventProviderWithMetadata,
} from "#management/domains/events/utils";

/** Augmented provider data with it's type. */
export type ProviderWithType = EventProvider & { type: EventProviderType };

/** Parameters needed to create a provider in Adobe I/O Events */
export type CreateIoProviderParams = {
  context: EventsExecutionContext;
  provider: ProviderWithType & { instanceId: string };
};

/** Parameters needed to create event metadata of a provider in Adobe I/O Events */
export type CreateIoProviderEventsMetadataParams = {
  metadata: ApplicationMetadata;
  context: EventsExecutionContext;
  type: EventProviderType;
  provider: IoEventProvider;
  event: AppEvent;
};

/** Parameters needed to create event event registrations in Adobe I/O Events. */
export type CreateRegistrationParams = {
  context: EventsExecutionContext;
  metadata: ApplicationMetadata;
  events: AppEventWithoutRuntimeActions[];
  provider: IoEventProvider;
  runtimeAction: string;
};

/** Parameters needed to onboard all the entities of Adobe I/O Events. */
export type OnboardIoEventsParams<EventType extends AppEvent> = {
  context: EventsExecutionContext;
  metadata: ApplicationMetadata;
  provider: EventProvider;
  events: EventType[];
  providerType: EventProviderType;
};

/** The returned data of an onboarded Adobe I/O event provider. */
export type ProviderDataFromIo<EventType extends AppEvent> = Awaited<
  ReturnType<typeof onboardIoEvents<EventType>>
>["providerData"];

/** The returned data of onboarded Adobe I/O events. */
export type EventsDataFromIo<EventType extends AppEvent> = Awaited<
  ReturnType<typeof onboardIoEvents<EventType>>
>["eventsData"];

/** The parameters needed to create an event provider in Commerce */
export type CreateCommerceProviderParams = {
  context: EventsExecutionContext;
  provider: Pick<
    IoEventProvider,
    "label" | "description" | "instance_id" | "id"
  > & { workspace_configuration: string };
};

/** The parameters needed to create event subscriptions in Commerce. */
export type CreateCommerceEventSubscriptionParams = {
  context: EventsExecutionContext;
  metadata: ApplicationMetadata;
  provider: ProviderDataFromIo<CommerceEvent>;
  event: ArrayElement<EventsDataFromIo<CommerceEvent>>;
};

/** The parameters needed to onboard all the entities of Commerce Eventing. */
export type OnboardCommerceEventingParams = {
  context: EventsExecutionContext;
  metadata: ApplicationMetadata;
  provider: EventProvider;

  ioData: {
    provider: ProviderDataFromIo<CommerceEvent>;
    events: EventsDataFromIo<CommerceEvent>;
    workspaceConfiguration: string;
  };
};

/** Parameters shared by `offboardIoEvents` and `offboardCommerceEventing`. */
export type OffboardEventsParams = {
  context: EventsExecutionContext;
  metadata: ApplicationMetadata;
  provider: EventProvider;
  events: AppEvent[];
};

/**
 * Find an existing event provider by its instance ID.
 * @param allProviders - The list of all existing event providers.
 * @param instanceId - The instance ID to search for.
 */
export function findExistingProvider<
  TProvider extends IoEventProvider | CommerceEventProvider,
>(allProviders: TProvider[], instanceId: string) {
  return (
    allProviders.find((provider) => provider.instance_id === instanceId) ?? null
  );
}

/**
 * Find existing event metadata by its event name.
 * @param allMetadata - The list of all existing event metadata.
 * @param eventName - The event name to search for.
 */
export function findExistingProviderMetadata(
  allMetadata: IoEventMetadata[],
  eventName: string,
) {
  return allMetadata.find((meta) => meta.event_code === eventName) ?? null;
}

/**
 * Find existing event registrations by client ID and name.
 * @param allRegistrations - The list of all existing event registrations.
 * @param clientId - The client ID of the workspace where the registration was created.
 * @param name - The name of the registration to search for.
 */
export function findExistingRegistrations(
  allRegistrations: IoEventRegistration[],
  clientId: string,
  name: string,
) {
  // We don't have an ID to search for, but names are deterministic and calculated by us so it should be fine.
  // To be safe, the `allRegistrations` should come from the current installation data.
  return allRegistrations.find(
    (reg) => reg.client_id === clientId && reg.name === name,
  );
}

/*
 * Find an existing Commerce event subscription by its event name.
 * @param allSubscriptions - Map of all existing event subscriptions keyed by event name.
 * @param eventName - The namespaced event name to search for.
 */
export function findExistingSubscription(
  allSubscriptions: Map<string, CommerceEventSubscription>,
  eventName: string,
) {
  return allSubscriptions.get(eventName) ?? null;
}

/**
 * Creates an event provider if it does not already exist.
 * @param params - The parameters necessary to create the provider.
 */
async function createIoEventProvider(params: CreateIoProviderParams) {
  const { context, provider } = params;
  const { appData, ioEventsClient, logger } = context;
  const appCredentials = {
    consumerOrgId: appData.consumerOrgId,
    projectId: appData.projectId,
    workspaceId: appData.workspaceId,
  };

  logger.info(
    `Creating provider "${provider.label}" with instance ID "${provider.instanceId}"`,
  );

  return ioEventsClient
    .createEventProvider({
      ...appCredentials,
      description: provider.description,
      instanceId: provider.instanceId,

      label: provider.label,
      providerType: provider.type,
    })
    .then((res) => {
      logger.info(`Provider "${provider.label}" created with ID '${res.id}'`);
      return res;
    })
    .catch((error) =>
      throwHttpError(
        logger,
        error,
        `Failed to create I/O Events provider '${provider.label}'`,
      ),
    );
}

/**
 * Creates or retrieves an existing I/O Events provider.
 * @param params - Parameters needed to create or get the provider.
 * @param existingData - Existing I/O Events data.
 */
async function createOrGetIoEventProvider(
  params: CreateIoProviderParams,
  existingData: IoEventProvider[],
) {
  const { context, provider } = params;
  const { logger } = context;
  const { instanceId, ...providerData } = provider;

  const existing = findExistingProvider(existingData, instanceId);
  if (existing) {
    logger.info(
      `Provider "${provider.label}" already exists with ID "${existing.id}", skipping creation.`,
    );

    return existing;
  }

  return createIoEventProvider({
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
async function createIoEventProviderEventMetadata(
  params: CreateIoProviderEventsMetadataParams,
) {
  const { context, event, provider, type, metadata } = params;
  const { appData, ioEventsClient, logger } = context;
  const appCredentials = {
    consumerOrgId: appData.consumerOrgId,
    projectId: appData.projectId,
    workspaceId: appData.workspaceId,
  };

  const eventCode = getIoEventCode(
    getNamespacedEvent(metadata, event.name),
    type,
  );

  logger.info(
    `Creating event metadata (${eventCode}) for provider "${provider.label}" (instance ID: ${provider.instance_id}))`,
  );

  return ioEventsClient
    .createEventMetadataForProvider({
      ...appCredentials,
      description: event.description,
      eventCode,

      label: event.label,
      providerId: provider.id,
    })
    .then((res) => {
      logger.info(
        `Event metadata "${event.label}" created for provider "${provider.label}"`,
      );

      return res;
    })
    .catch((error) =>
      throwHttpError(
        logger,
        error,
        `Failed to register I/O Events metadata for '${eventCode}'`,
      ),
    );
}

/**
 * Creates or retrieves existing I/O Events metadata for a given provider and event.
 * @param params - The parameters necessary to create or get the event metadata.
 * @param existingData - Existing I/O Events metadata for the provider.
 */
async function createOrGetIoProviderEventMetadata(
  params: CreateIoProviderEventsMetadataParams,
  existingData: IoEventMetadata[],
) {
  const { context, event, provider, type, metadata } = params;
  const { logger } = context;

  const eventCode = getIoEventCode(
    getNamespacedEvent(metadata, event.name),
    type,
  );

  const existing = findExistingProviderMetadata(existingData, eventCode);
  if (existing) {
    logger.info(
      `Event metadata "${event.label}" already exists for provider "${provider.label}" (instance ID: ${provider.instance_id}), skipping creation.`,
    );

    return existing;
  }

  return createIoEventProviderEventMetadata(params);
}

/**
 * Creates an event registration bound to the given provider ID for a set of events targeting the given runtime action.
 * @param params - The parameters necessary to create the registration.
 */
async function createIoEventRegistration(params: CreateRegistrationParams) {
  const { context, events, provider, runtimeAction, metadata } = params;
  const { appData, ioEventsClient, logger, params: runtimeParams } = context;
  const appCredentials = {
    consumerOrgId: appData.consumerOrgId,
    projectId: appData.projectId,
    workspaceId: appData.workspaceId,
  };

  logger.info(
    `Creating registration(s) to runtime action "${runtimeAction}" for ${events.length} event(s) with provider "${provider.label}" (instance ID: ${provider.instance_id}))`,
  );

  const name = getRegistrationName(provider, runtimeAction);
  const description = getRegistrationDescription(
    provider,
    events,
    runtimeAction,
  );

  const payload = {
    ...appCredentials,
    clientId: resolveImsAuthParams(runtimeParams).clientId,
    deliveryType: "webhook",
    description,

    enabled: true,
    eventsOfInterest: events.map((event) => ({
      eventCode: getIoEventCode(
        getNamespacedEvent(metadata, event.name),
        provider.provider_metadata as EventProviderType,
      ),
      providerId: provider.id,
    })),

    name,
    runtimeAction,
  } as const;

  return ioEventsClient
    .createRegistration(payload)
    .then((res) => {
      logger.info(
        `Registration "${name}" created for provider "${provider.label}" with ID '${res.id}'`,
      );

      return res;
    })
    .catch((error) =>
      throwHttpError(
        logger,
        error,
        `Failed to create I/O Events registration '${name}'`,
      ),
    );
}

/**
 * Creates or retrieves an existing I/O Events registration.
 * @param params - Parameters needed to create or get the registration.
 * @param existingData - Existing I/O Events data.
 */
async function createOrGetIoEventRegistration(
  params: CreateRegistrationParams,
  registrations: IoEventRegistration[],
) {
  const { context, provider, runtimeAction } = params;
  const { logger, params: runtimeParams } = context;

  // Check if a registration already exists for this provider and runtime action.
  const name = getRegistrationName(provider, runtimeAction);
  const existing = findExistingRegistrations(
    registrations,
    resolveImsAuthParams(runtimeParams).clientId,
    name,
  );

  if (existing) {
    logger.info(
      `Registration "${name}" already exists for provider "${provider.label}" with ID '${existing.id}', skipping creation.`,
    );

    return existing;
  }

  return createIoEventRegistration(params);
}

/**
 * Creates an event provider in Commerce for a given {@link IoEventProvider}.
 * @param params - The parameters necessary to create the Commerce provider.
 */
export async function createCommerceProvider(
  params: CreateCommerceProviderParams,
) {
  const { context, provider } = params;
  const { commerceEventsClient, logger } = context;

  logger.info(
    `Creating Commerce provider "${provider.label}" with instance ID "${provider.instance_id}"`,
  );

  return commerceEventsClient
    .createEventProvider({
      ...provider,
      provider_id: provider.id,
    })
    .then((res) => {
      logger.info(
        `Commerce provider "${provider.label}" created with ID '${res.provider_id}'`,
      );

      return res;
    })
    .catch((err) =>
      throwHttpError(
        logger,
        err,
        `Failed to create Adobe Commerce event provider '${provider.label}'`,
      ),
    );
}

/**
 * Creates or retrieves an existing Commerce event provider.
 *
 * Checks by `provider_id` first, since Commerce validates subscriptions against that field.
 * A previous partial run may have left multiple records sharing the same `instance_id` but
 * with different `provider_id` values; checking by `provider_id` first avoids re-creating a
 * provider that is already correctly registered.
 *
 * @param params - Parameters needed to create or get the Commerce provider.
 * @param existingProviders - Existing Commerce providers.
 */
export async function createOrGetCommerceProvider(
  params: CreateCommerceProviderParams,
  existingProviders: CommerceEventProvider[],
) {
  const { context, provider } = params;
  const { logger } = context;

  const existingByProviderId = existingProviders.find(
    (p) => p.provider_id === provider.id,
  );

  if (existingByProviderId) {
    logger.info(
      `Provider "${provider.label}" already exists with provider ID "${provider.id}", skipping creation.`,
    );

    return existingByProviderId;
  }

  const existingByInstanceId = findExistingProvider(
    existingProviders,
    provider.instance_id,
  );

  if (existingByInstanceId) {
    logger.warn(
      `Provider "${provider.label}" exists (instance ID: ${provider.instance_id}) but with a different ` +
        `provider ID ("${existingByInstanceId.provider_id}" → "${provider.id}"). Registering updated provider in Commerce.`,
    );
  }

  return createCommerceProvider(params);
}

/**
 * Creates an event subscription in Commerce for the given event and provider.
 * @param params - The parameters necessary to create the Commerce event subscription.
 */
async function createCommerceEventSubscription(
  params: CreateCommerceEventSubscriptionParams,
) {
  const { context, metadata, provider, event } = params;
  const { logger, commerceEventsClient } = context;

  const eventName = getNamespacedEvent(metadata, event.config.name);
  logger.info(
    `Creating event subscription for event "${event.config.name}" to provider "${provider.label}" (instance ID: ${provider.instance_id})`,
  );

  const eventSpec: EventSubscriptionCreateParams = {
    destination: event.config.destination,
    fields: event.config.fields,
    force: event.config.force,
    hipaa_audit_required: event.config.hipaa_audit_required,
    name: eventName,
    parent: event.config.name,
    priority: event.config.priority,
    provider_id: provider.id,
    rules: event.config.rules,
  };

  logger.debug(
    `Event subscription specification for event "${event.config.name}": ${inspect(eventSpec)}`,
  );

  return commerceEventsClient
    .createEventSubscription(eventSpec)
    .then(async (_res) => {
      logger.info(
        `Created event subscription for event "${event.config.name}" to provider "${provider.label} (instance ID: ${provider.instance_id})"`,
      );

      await restoreEventMetadataText(
        event.data.metadata.event_code,
        event.config,
        provider.id,
        context,
      );
      return eventSpec;
    })
    .catch((err) =>
      throwHttpError(
        logger,
        err,
        `Failed to create Adobe Commerce event subscription for '${event.config.name}'`,
      ),
    );
}

/**
 * Creates or retrieves an existing Commerce event subscription.
 * @param params - Parameters needed to create or get the subscription.
 * @param existingData - Map of existing Commerce subscriptions keyed by event name.
 */
async function createOrGetCommerceEventSubscription(
  params: CreateCommerceEventSubscriptionParams,
  existingData: Map<string, CommerceEventSubscription>,
) {
  const { context, metadata, event } = params;
  const { logger } = context;

  const eventName = getNamespacedEvent(metadata, event.config.name);
  const existing = findExistingSubscription(existingData, eventName);

  if (existing) {
    logger.info(
      `Subscription for event "${event.config.name}" already exists, skipping creation.`,
    );

    return existing;
  }

  return createCommerceEventSubscription(params);
}

/**
 * Onboards a single event source to I/O Events by creating/retrieving the provider and its event metadata.
 * This is the shared logic inside the loop for both commerce and external event installation steps.
 *
 * @param params - Configuration for onboarding a single event source
 * @param existingData - Existing I/O Events data
 */
export async function onboardIoEvents<EventType extends AppEvent>(
  params: OnboardIoEventsParams<EventType>,
  existingData: ExistingIoEventsData,
) {
  const { providersWithMetadata, registrations } = existingData;
  const { context, metadata, provider, providerType, events } = params;

  const instanceId = generateInstanceId(
    metadata,
    provider,
    context.appData.workspaceId,
  );

  const providerData = await createOrGetIoEventProvider(
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
        event,
        metadata,
        provider: providerData,
        type: providerType,
      },

      // Retrieve the existing metadata for this provider, if any.
      providersWithMetadata.find((p) => p.id === providerData.id)?.metadata ??
        [],
    ),
  );

  const actionEventsMap = groupEventsByRuntimeActions(events);
  const registrationPromises = Array.from(actionEventsMap.entries()).map(
    ([runtimeAction, groupedEvents]) =>
      createOrGetIoEventRegistration(
        {
          context,
          events: groupedEvents,
          metadata,
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
    eventsData,
    providerData,
  };
}

/**
 * Onboards Commerce Eventing by creating event subscriptions and configuring the Eventing Module.
 * @param params - The parameters necessary to onboard Commerce Eventing.
 */
export async function onboardCommerceEventing(
  params: OnboardCommerceEventingParams,
  existingData: ExistingCommerceEventingData,
) {
  const { context, metadata, ioData } = params;
  const { events, provider, workspaceConfiguration } = ioData;

  const instanceId = provider.instance_id;

  const commerceProvider = await createOrGetCommerceProvider(
    {
      context,
      provider: {
        description: provider.description,
        id: provider.id,
        instance_id: instanceId,
        label: provider.label,
        workspace_configuration: workspaceConfiguration,
      },
    },
    existingData.providers,
  );

  // Remove sensitive data from the provider data before returning it.
  const { workspace_configuration: _, ...commerceProviderData } =
    commerceProvider;

  const subscriptions: Awaited<
    ReturnType<typeof createOrGetCommerceEventSubscription>
  >[] = [];

  for (const event of events) {
    subscriptions.push(
      // biome-ignore lint/performance/noAwaitInLoops: Commerce writes shared eventing configuration, so subscriptions must be created sequentially
      await createOrGetCommerceEventSubscription(
        { context, event, metadata, provider },
        existingData.subscriptions,
      ),
    );
  }

  return {
    commerceProvider: commerceProviderData,
    subscriptions,
  };
}

/**
 * Deletes all I/O Events registrations for the given provider.
 * Registration names are reconstructed deterministically using the same logic as during installation.
 * Errors are caught and logged so that uninstall remains best-effort.
 */
async function deleteIoEventRegistrations(
  providerData: IoEventProviderWithMetadata,
  provider: EventProvider,
  events: AppEvent[],
  registrations: IoEventRegistration[],
  context: EventsExecutionContext,
) {
  const { ioEventsClient, appData, logger, params: runtimeParams } = context;
  const appCredentials = {
    consumerOrgId: appData.consumerOrgId,
    projectId: appData.projectId,
    workspaceId: appData.workspaceId,
  };

  // The getAllRegistrations list endpoint does not populate events_of_interest,
  // so we reconstruct the expected registration names the same way as during installation.
  const actionEventsMap = groupEventsByRuntimeActions(events);
  const runtimeActions = Array.from(actionEventsMap.keys());
  const registrationNames = new Set([
    ...runtimeActions.map((runtimeAction) =>
      getRegistrationName(providerData, runtimeAction),
    ),
    // Also match registrations created by older SDK versions that used the generic
    // provider type label ("Commerce" / "External") instead of the provider label.
    ...runtimeActions.map((runtimeAction) =>
      getLegacyRegistrationName(providerData, runtimeAction),
    ),
  ]);
  const { clientId } = resolveImsAuthParams(runtimeParams);
  const providerRegistrations = registrations.filter(
    (reg) => reg.client_id === clientId && registrationNames.has(reg.name),
  );

  if (providerRegistrations.length === 0) {
    logger.info(
      `No I/O Events registrations found for provider "${provider.label}" (instance ID: "${providerData.instance_id}").`,
    );
    return;
  }

  logger.info(
    `Deleting ${providerRegistrations.length} I/O Events registration(s) for provider "${provider.label}" (instance ID: "${providerData.instance_id}")...`,
  );

  for (const registration of providerRegistrations) {
    logger.info(
      `Deleting registration "${registration.name}" (ID: ${registration.id})...`,
    );

    try {
      // biome-ignore lint/performance/noAwaitInLoops: deletes hit the Adobe I/O Events API sequentially to avoid a rate-limit burst during uninstall
      await ioEventsClient.deleteRegistration({
        ...appCredentials,
        registrationId: registration.registration_id,
      });
      logger.info(
        `Deleted registration "${registration.name}" (ID: ${registration.id}).`,
      );
    } catch (error) {
      const msg = await unwrapHttpError(error);
      logger.warn(
        `Failed to delete I/O Events registration "${registration.name}" (ID: ${registration.id}): ${msg}. Continuing uninstall.`,
      );
    }
  }
}

/**
 * Deletes all event metadata entries from the given I/O Events provider.
 * Errors are caught and logged so that uninstall remains best-effort.
 */
async function deleteIoEventMetadata(
  providerData: IoEventProviderWithMetadata,
  provider: EventProvider,
  context: EventsExecutionContext,
) {
  const { ioEventsClient, appData, logger } = context;
  const appCredentials = {
    consumerOrgId: appData.consumerOrgId,
    projectId: appData.projectId,
    workspaceId: appData.workspaceId,
  };

  const eventMetadataList = providerData.metadata ?? [];

  if (eventMetadataList.length === 0) {
    logger.info(
      `No event metadata found for provider "${provider.label}" (ID: ${providerData.id}).`,
    );
    return;
  }

  logger.info(
    `Deleting ${eventMetadataList.length} event metadata entry(s) for provider "${provider.label}" (ID: ${providerData.id})...`,
  );

  for (const eventMetadata of eventMetadataList) {
    logger.info(
      `Deleting event metadata "${eventMetadata.event_code}" from provider "${providerData.id}"...`,
    );

    try {
      // biome-ignore lint/performance/noAwaitInLoops: deletes hit the Adobe I/O Events API sequentially to avoid a rate-limit burst during uninstall
      await ioEventsClient.deleteEventMetadataForProvider({
        ...appCredentials,
        eventCode: eventMetadata.event_code,
        providerId: providerData.id,
      });
      logger.info(
        `Deleted event metadata "${eventMetadata.event_code}" from provider "${providerData.id}".`,
      );
    } catch (error) {
      const msg = await unwrapHttpError(error);
      logger.warn(
        `Failed to delete I/O Events metadata "${eventMetadata.event_code}" from provider "${providerData.id}": ${msg}. Continuing uninstall.`,
      );
    }
  }
}

/**
 * Deletes a single I/O Events provider.
 * Errors are caught and logged so that uninstall remains best-effort.
 */
async function deleteIoEventProvider(
  providerData: IoEventProviderWithMetadata,
  provider: EventProvider,
  context: EventsExecutionContext,
) {
  const { ioEventsClient, appData, logger } = context;
  const appCredentials = {
    consumerOrgId: appData.consumerOrgId,
    projectId: appData.projectId,
    workspaceId: appData.workspaceId,
  };

  logger.info(
    `Deleting I/O Events provider "${provider.label}" (ID: ${providerData.id})...`,
  );

  try {
    await ioEventsClient.deleteEventProvider({
      ...appCredentials,
      providerId: providerData.id,
    });
    logger.info(
      `Deleted I/O Events provider "${provider.label}" (ID: ${providerData.id}).`,
    );
  } catch (error) {
    const msg = await unwrapHttpError(error);
    logger.warn(
      `Failed to delete I/O Events provider "${provider.label}" (ID: ${providerData.id}): ${msg}. Continuing uninstall.`,
    );
  }
}

/**
 * Offboards a single event source from I/O Events by deleting, in order:
 * 1. All registrations that reference events from this provider.
 * 2. All event metadata entries on the provider.
 * 3. The provider itself.
 *
 * This is the reverse of {@link onboardIoEvents} and is called during uninstall.
 * All deletion errors are caught and logged so that uninstall remains best-effort.
 *
 * @param params - Configuration identifying the provider to offboard.
 * @param existingData - Current I/O Events data (providers and registrations).
 */
export async function offboardIoEvents(
  params: OffboardEventsParams,
  existingData: ExistingIoEventsData,
) {
  const { context, metadata, provider, events } = params;
  const { appData, logger } = context;

  const instanceId = generateInstanceId(
    metadata,
    provider,
    appData.workspaceId,
  );

  const instanceIdOldVersion = generateInstanceIdDeprecated(metadata, provider);

  const providerData = existingData.providersWithMetadata.find(
    (p) =>
      p.instance_id === instanceId || p.instance_id === instanceIdOldVersion,
  );

  if (!providerData) {
    logger.info(
      `No I/O Events provider found with instance ID "${instanceId}", skipping offboarding.`,
    );
    return;
  }

  await deleteIoEventRegistrations(
    providerData,
    provider,
    events,
    existingData.registrations,
    context,
  );
  await deleteIoEventMetadata(providerData, provider, context);
  await deleteIoEventProvider(providerData, provider, context);
}

/**
 * Deletes all Commerce event subscriptions for the given events.
 * Subscriptions are matched by their namespaced name, built the same way as during installation.
 * Errors are caught and logged so that uninstall remains best-effort.
 */
async function deleteCommerceEventSubscriptions(
  events: AppEvent[],
  metadata: ApplicationMetadata,
  provider: EventProvider,
  existingSubscriptions: Map<string, CommerceEventSubscription>,
  context: EventsExecutionContext,
) {
  const { commerceEventsClient, logger } = context;

  logger.info(
    `Unsubscribing Commerce event subscriptions for provider "${provider.label}"...`,
  );

  for (const event of events) {
    const eventName = getNamespacedEvent(metadata, event.name);

    if (!existingSubscriptions.has(eventName)) {
      logger.info(
        `No Commerce subscription found for event "${event.name}" (namespaced: "${eventName}"), skipping.`,
      );
      continue;
    }

    logger.info(
      `Unsubscribing Commerce event subscription for "${event.name}" (namespaced: "${eventName}")...`,
    );

    try {
      // biome-ignore lint/performance/noAwaitInLoops: unsubscribes hit the Adobe Commerce API sequentially to avoid a rate-limit burst during uninstall
      await commerceEventsClient.deleteEventSubscription({
        name: eventName,
      });
      logger.info(
        `Unsubscribed Commerce event subscription for "${eventName}".`,
      );
    } catch (error) {
      const msg = await unwrapHttpError(error);
      logger.warn(
        `Failed to unsubscribe Adobe Commerce event subscription for "${eventName}": ${msg}. Continuing uninstall.`,
      );
    }
  }
}

/**
 * Deletes a single Commerce-side event provider.
 * The provider is matched by its deterministic `instance_id`. If not found, deletion is skipped.
 * Errors are caught and logged so that uninstall remains best-effort.
 */
async function deleteCommerceEventProvider(
  metadata: ApplicationMetadata,
  provider: EventProvider,
  existingProviders: CommerceEventProvider[],
  context: EventsExecutionContext,
) {
  const { commerceEventsClient, appData, logger } = context;

  const instanceId = generateInstanceId(
    metadata,
    provider,
    appData.workspaceId,
  );

  const instanceIdOldVersion = generateInstanceIdDeprecated(metadata, provider);

  const commerceProvider = existingProviders.find(
    (p) =>
      p.instance_id === instanceId || p.instance_id === instanceIdOldVersion,
  );

  if (!commerceProvider) {
    logger.info(
      `No Commerce event provider found with instance ID "${instanceId}", skipping provider deletion.`,
    );
    return;
  }

  logger.info(
    `Deleting Commerce event provider "${provider.label}" (provider_id: ${commerceProvider.provider_id})...`,
  );

  try {
    await commerceEventsClient.deleteEventProvider({
      provider_id: commerceProvider.provider_id,
    });
    logger.info(
      `Deleted Commerce event provider "${provider.label}" (provider_id: ${commerceProvider.provider_id}).`,
    );
  } catch (error) {
    const msg = await unwrapHttpError(error);
    logger.warn(
      `Failed to delete Adobe Commerce event provider "${provider.label}" (provider_id: ${commerceProvider.provider_id}): ${msg}. Continuing uninstall.`,
    );
  }
}

/**
 * Offboards Commerce eventing for a single provider. Performs the following steps in order:
 * 1. Unsubscribes all event subscriptions that were created for the given provider.
 * 2. Deletes the Commerce-side event provider itself.
 *
 * Subscriptions are matched by their namespaced name, which is deterministic and built the
 * same way as during {@link onboardCommerceEventing}. The provider is matched by its
 * `instance_id`. Missing subscriptions or providers are silently skipped. All errors are
 * caught and logged so that uninstall remains best-effort.
 *
 * @param params - Configuration identifying the provider and its events to offboard.
 * @param existingData - Current Commerce eventing data (providers and subscriptions).
 */
export async function offboardCommerceEventing(
  params: OffboardEventsParams,
  existingData: ExistingCommerceEventingData,
) {
  const { context, metadata, provider, events } = params;

  await deleteCommerceEventSubscriptions(
    events,
    metadata,
    provider,
    existingData.subscriptions,
    context,
  );
  await deleteCommerceEventProvider(
    metadata,
    provider,
    existingData.providers,
    context,
  );
}
