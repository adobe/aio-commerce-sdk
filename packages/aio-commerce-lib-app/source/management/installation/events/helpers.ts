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

import { inspect } from "@aio-commerce-sdk/common-utils/logging";
import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";

import {
  findExistingProvider,
  findExistingProviderMetadata,
  findExistingRegistrations,
  findExistingSubscription,
  generateInstanceId,
  getIoEventCode,
  getNamespacedEvent,
  getRegistrationDescription,
  getRegistrationName,
  groupEventsByRuntimeActions,
} from "./utils";

import type {
  CommerceEventProvider,
  CommerceEventSubscription,
  EventSubscriptionCreateParams,
  UpdateEventingConfigurationParams,
} from "@adobe/aio-commerce-lib-events/commerce";
import type {
  EventProviderType,
  IoEventMetadata,
  IoEventProvider,
  IoEventRegistration,
} from "@adobe/aio-commerce-lib-events/io-events";
import type { AppEvent } from "#config/schema/eventing";
import type {
  ConfigureCommerceEventingParams,
  CreateCommerceEventSubscriptionParams,
  CreateCommerceProviderParams,
  CreateIoProviderEventsMetadataParams,
  CreateIoProviderParams,
  CreateRegistrationParams,
  OnboardCommerceEventingParams,
  OnboardIoEventsParams,
} from "./types";
import type {
  ExistingCommerceEventingData,
  ExistingIoEventsData,
} from "./utils";

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

  return ioEventsClient
    .createRegistration({
      ...appCredentials,

      name,
      clientId: runtimeParams.AIO_COMMERCE_AUTH_IMS_CLIENT_ID,
      description,
      deliveryType: "webhook",
      runtimeAction,

      enabled: true,
      eventsOfInterest: events.map((event) => ({
        providerId: provider.id,
        eventCode: getIoEventCode(
          getNamespacedEvent(metadata, event.name),
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
    runtimeParams.AIO_COMMERCE_AUTH_IMS_CLIENT_ID,
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
 * Ensures Commerce Eventing is configured with the given configuration, updating it if it already exists.
 * @param eventsClient
 * @param params
 * @param existingData
 */
async function configureCommerceEventing(
  params: ConfigureCommerceEventingParams,
  existingData: ExistingCommerceEventingData,
) {
  const { context, config } = params;
  const { commerceEventsClient, logger } = context;
  logger.info("Starting configuration of the Commerce Eventing Module");

  // Always ensure eventing is enabled
  let updateParams: UpdateEventingConfigurationParams = {
    ...config,
    enabled: true,
  };

  if (existingData.isDefaultWorkspaceConfigurationEmpty) {
    if (!config.workspaceConfiguration) {
      const message =
        "Workspace configuration is required to enable Commerce Eventing when there is not an existing one.";

      logger.error(message);
      throw new Error(message);
    }

    logger.info(
      "Default provider workspace configuration already present, it will not be overriden",
    );

    // Remove the workspace configuration to avoid overriding it
    const { workspaceConfiguration, ...rest } = updateParams;
    updateParams = rest;
  }

  logger.info(
    "Updating Commerce Eventing configuration with provided workspace configuration.",
  );

  return commerceEventsClient
    .updateEventingConfiguration(updateParams)
    .then((success) => {
      if (success) {
        logger.info("Commerce Eventing Module configured successfully.");
        return;
      }

      // This will be catched by the catch block below, and logged accordingly.
      throw new Error(
        "Something went wrong while configuring Commerce Eventing Module. Response was not successful but no error was thrown.",
      );
    })
    .catch((err) => {
      logger.error(
        `Failed to configure Commerce Eventing Module: ${stringifyError(err)}`,
      );

      throw err;
    });
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
      providerId: provider.id,
      instanceId: provider.instance_id,
      label: provider.label,
      description: provider.description,
      associatedWorkspaceConfiguration: provider.workspaceConfiguration,
    })
    .then((res) => {
      logger.info(
        `Commerce provider "${provider.label}" created with ID '${res.provider_id}'`,
      );

      return res;
    })
    .catch((err) => {
      logger.error(
        `Failed to create Commerce provider "${provider.label}": ${stringifyError(err)}`,
      );

      throw err;
    });
}

/**
 * Creates or retrieves an existing Commerce event provider.
 * @param params - Parameters needed to create or get the Commerce provider.
 * @param existingData - Existing Commerce providers.
 */
export async function createOrGetCommerceProvider(
  params: CreateCommerceProviderParams,
  existingProviders: CommerceEventProvider[],
) {
  const { context, provider } = params;
  const { logger } = context;

  const existing = findExistingProvider(
    existingProviders,
    provider.instance_id,
  );

  if (existing) {
    logger.info(
      `Provider "${provider.label}" already exists with ID "${existing.id}", skipping creation.`,
    );

    return existing;
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
    name: eventName,
    parent: event.config.name,
    fields: event.config.fields.map((field) => ({ name: field })),
    providerId: provider.id,
    destination: event.config.destination,
    hipaaAuditRequired: event.config.hipaaAuditRequired,
    prioritary: event.config.prioritary,
    force: event.config.force,
  };

  logger.debug(
    `Event subscription specification for event "${event.config.name}": ${inspect(eventSpec)}`,
  );

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

    return {
      name: existing.name,
      parent: existing.parent,
      fields: existing.fields,
      providerId: existing.provider_id,
    };
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

  const instanceId = generateInstanceId(metadata, provider);
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
        metadata,
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
      createOrGetIoEventRegistration(
        {
          metadata,
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
  const subscriptions: Partial<CommerceEventSubscription>[] = [];

  // The eventing module must be configured before creating the other entities.
  await configureCommerceEventing(
    {
      context,
      config: {
        workspaceConfiguration,
      },
    },
    existingData,
  );

  const commerceProvider = await createOrGetCommerceProvider(
    {
      context,
      provider: {
        id: provider.id,
        instance_id: instanceId,
        label: provider.label,
        description: provider.description,
        workspaceConfiguration,
      },
    },
    existingData.providers,
  );

  // Remove sensitive data from the provider data before returning it.
  const { workspace_configuration: _, ...commerceProviderData } =
    commerceProvider;

  for (const event of events) {
    subscriptions.push(
      await createOrGetCommerceEventSubscription(
        { context, metadata, provider, event },
        existingData.subscriptions,
      ),
    );
  }

  return {
    commerceProvider: commerceProviderData,
    subscriptions,
  };
}
