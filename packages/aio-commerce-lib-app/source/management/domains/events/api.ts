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
import { HTTPError } from "ky";

import {
  isHttpNotFoundError,
  throwHttpError,
} from "#management/common/utils/http-error";

import {
  COMMERCE_PROVIDER_TYPE,
  getCommerceEventingConfigurationUpdateParams,
  getIoEventCode,
  makeWorkspaceConfig,
} from "./utils";

import type { CommerceEvent } from "#config/schema/eventing";
import type { EventsExecutionContext } from "./context";
import type {
  ConfigureCommerceEventingParams,
  EventingOperationValue,
} from "./types";
import type { ExistingCommerceEventingData } from "./utils";

/** The operation value of one resource type. */
export type ValueOf<TType extends EventingOperationValue["resourceType"]> =
  Extract<EventingOperationValue, { resourceType: TType }>;

/** The workspace an app's I/O Events resources live in. */
function workspaceOf(context: EventsExecutionContext) {
  const { consumerOrgId, projectId, workspaceId } = context.appData;
  return { consumerOrgId, projectId, workspaceId };
}

/**
 * Unsubscribes a Commerce event. Throws on failure: a lingering subscription keeps Commerce
 * emitting the event. A subscription that is already gone counts as removed.
 */
export async function deleteSubscription(
  name: string,
  context: EventsExecutionContext,
): Promise<void> {
  const { commerceEventsClient, logger } = context;
  try {
    await commerceEventsClient.deleteEventSubscription({ name });
    logger.info(`Deleted Commerce event subscription "${name}".`);
  } catch (error) {
    if (isHttpNotFoundError(error) || (await isSubscriptionMissing(error))) {
      logger.info(`Commerce event subscription "${name}" already removed.`);
      return;
    }

    await throwHttpError(
      logger,
      error,
      `Failed to delete Commerce event subscription "${name}"`,
    );
  }
}

/**
 * Whether Commerce rejected an unsubscribe because the subscription does not exist. Commerce
 * answers that with a 400, not a 404.
 */
async function isSubscriptionMissing(error: unknown) {
  if (!(error instanceof HTTPError) || error.response.status !== 400) {
    return false;
  }

  const body = await error.response
    .clone()
    .text()
    .catch(() => "");

  return body.includes("is not registered. You cannot unsubscribe from it.");
}

/** Deletes a registration. Throws on failure: it would keep delivering events to the app. */
export async function deleteRegistration(
  value: ValueOf<"registration">,
  context: EventsExecutionContext,
): Promise<void> {
  const { ioEventsClient, logger } = context;
  try {
    await ioEventsClient.deleteRegistration({
      ...workspaceOf(context),
      registrationId: value.registrationId as string,
    });
    logger.info(`Deleted registration "${value.name}".`);
  } catch (error) {
    await throwHttpError(
      logger,
      error,
      `Failed to delete registration "${value.name}"`,
    );
  }
}

/**
 * Deletes event metadata. Metadata that is already gone counts as removed: for Commerce events
 * the unsubscribe before it usually deletes it.
 */
export async function deleteMetadata(
  value: ValueOf<"metadata">,
  context: EventsExecutionContext,
): Promise<void> {
  const { ioEventsClient, logger } = context;
  try {
    await ioEventsClient.deleteEventMetadataForProvider({
      ...workspaceOf(context),
      eventCode: value.eventCode,
      providerId: value.providerId as string,
    });
    logger.info(`Deleted event metadata "${value.eventCode}".`);
  } catch (error) {
    if (isHttpNotFoundError(error)) {
      logger.info(`Event metadata "${value.eventCode}" already removed.`);
      return;
    }

    await throwHttpError(
      logger,
      error,
      `Failed to delete event metadata "${value.eventCode}"`,
    );
  }
}

/** Deletes a Commerce event provider. */
export async function deleteCommerceProvider(
  value: ValueOf<"commerceProvider">,
  context: EventsExecutionContext,
): Promise<void> {
  const { commerceEventsClient, logger } = context;
  const providerId = value.providerId as string;
  try {
    await commerceEventsClient.deleteEventProvider({ provider_id: providerId });
    logger.info(`Deleted Commerce event provider "${value.label}".`);
  } catch (error) {
    await throwHttpError(
      logger,
      error,
      `Failed to delete Commerce event provider "${value.label}"`,
    );
  }
}

/** Deletes an I/O Events provider. */
export async function deleteProvider(
  value: ValueOf<"provider">,
  context: EventsExecutionContext,
): Promise<void> {
  const { ioEventsClient, logger } = context;
  try {
    await ioEventsClient.deleteEventProvider({
      ...workspaceOf(context),
      providerId: value.providerId as string,
    });
    logger.info(`Deleted event provider "${value.label}".`);
  } catch (error) {
    await throwHttpError(
      logger,
      error,
      `Failed to delete event provider "${value.label}"`,
    );
  }
}

/** Updates an I/O Events provider's label and description. */
export async function updateProvider(
  before: ValueOf<"provider">,
  after: ValueOf<"provider">,
  context: EventsExecutionContext,
): Promise<void> {
  const { ioEventsClient, logger } = context;
  try {
    await ioEventsClient.updateEventProvider({
      ...workspaceOf(context),
      description: after.description,
      label: after.label,
      providerId: before.providerId as string,
    });
    logger.info(`Updated event provider "${after.label}".`);
  } catch (error) {
    await throwHttpError(
      logger,
      error,
      `Failed to update event provider "${after.label}"`,
    );
  }
}

/** Updates a Commerce event provider's label and description. */
export async function updateCommerceProvider(
  before: ValueOf<"commerceProvider">,
  after: ValueOf<"commerceProvider">,
  context: EventsExecutionContext,
): Promise<void> {
  const { commerceEventsClient, logger } = context;
  try {
    await commerceEventsClient.updateEventProvider({
      description: after.description,
      id: Number(before.commerceProviderId),
      instance_id: before.instanceId as string,
      label: after.label,
      provider_id: before.providerId as string,
    });
    logger.info(`Updated Commerce event provider "${after.label}".`);
  } catch (error) {
    await throwHttpError(
      logger,
      error,
      `Failed to update Commerce event provider "${after.label}"`,
    );
  }
}

/** Updates an event's metadata label and description. */
export async function updateMetadata(
  after: ValueOf<"metadata">,
  context: EventsExecutionContext,
): Promise<void> {
  const { ioEventsClient, logger } = context;
  try {
    await ioEventsClient.updateEventMetadataForProvider({
      ...workspaceOf(context),
      description: after.description ?? "",
      eventCode: after.eventCode,
      label: after.label,
      providerId: after.providerId as string,
    });
    logger.info(`Updated event metadata "${after.eventCode}".`);
  } catch (error) {
    await throwHttpError(
      logger,
      error,
      `Failed to update event metadata "${after.eventCode}"`,
    );
  }
}

/** Replaces a registration with its desired name, description and events. */
export async function updateRegistration(
  before: ValueOf<"registration">,
  after: ValueOf<"registration">,
  context: EventsExecutionContext,
): Promise<void> {
  const { ioEventsClient, logger, params } = context;
  const providerId = after.providerId as string;
  try {
    await ioEventsClient.updateRegistration({
      ...workspaceOf(context),
      clientId: resolveImsAuthParams(params).clientId,
      deliveryType: "webhook",
      description: after.description,
      enabled: true,
      eventsOfInterest: after.eventCodes.map((eventCode) => ({
        eventCode,
        providerId,
      })),
      name: after.name,
      registrationId: before.registrationId as string,
      runtimeAction: after.runtimeAction,
    });
    logger.info(`Updated registration "${after.name}".`);
  } catch (error) {
    await throwHttpError(
      logger,
      error,
      `Failed to update registration "${after.name}"`,
    );
  }
}

/** Updates a Commerce subscription in place with its target event settings. */
export async function updateSubscription(
  after: ValueOf<"subscription">,
  event: CommerceEvent,
  context: EventsExecutionContext,
): Promise<void> {
  const { commerceEventsClient, logger } = context;
  try {
    await commerceEventsClient.updateEventSubscription({
      fields: event.fields,
      hipaa_audit_required: event.hipaa_audit_required,
      name: after.name,
      parent: event.name,
      priority: event.priority,
      provider_id: after.providerId as string,
      rules: event.rules,
    });
    logger.info(
      `Updated Commerce event subscription "${after.name}" in place.`,
    );
  } catch (error) {
    await throwHttpError(
      logger,
      error,
      `Failed to update Commerce event subscription "${after.name}"`,
    );
  }
}

/** Creates an I/O Events provider and returns its id. */
export async function createProvider(
  value: ValueOf<"provider">,
  context: EventsExecutionContext,
): Promise<string> {
  const { ioEventsClient, logger } = context;
  try {
    const provider = await ioEventsClient.createEventProvider({
      ...workspaceOf(context),
      description: value.description,
      instanceId: value.instanceId as string,
      label: value.label,
      providerType: value.type,
    });

    logger.info(`Created event provider "${value.label}" (${provider.id}).`);
    return provider.id;
  } catch (error) {
    return await throwHttpError(
      logger,
      error,
      `Failed to create event provider "${value.label}"`,
    );
  }
}

/** Registers an I/O Events provider in Commerce. */
export async function createCommerceProvider(
  value: ValueOf<"commerceProvider">,
  providerId: string,
  context: EventsExecutionContext,
): Promise<void> {
  const { commerceEventsClient, logger } = context;
  try {
    await commerceEventsClient.createEventProvider({
      description: value.description,
      instance_id: value.instanceId as string,
      label: value.label,
      provider_id: providerId,
      workspace_configuration: JSON.stringify(makeWorkspaceConfig(context)),
    });

    logger.info(`Created Commerce event provider "${value.label}".`);
  } catch (error) {
    await throwHttpError(
      logger,
      error,
      `Failed to create Commerce event provider "${value.label}"`,
    );
  }
}

/** Creates an event's metadata on its provider. */
export async function createMetadata(
  value: ValueOf<"metadata">,
  providerId: string,
  context: EventsExecutionContext,
): Promise<void> {
  const { ioEventsClient, logger } = context;
  try {
    await ioEventsClient.createEventMetadataForProvider({
      ...workspaceOf(context),
      description: value.description ?? "",
      eventCode: value.eventCode,
      label: value.label,
      providerId,
    });

    logger.info(`Created event metadata "${value.eventCode}".`);
  } catch (error) {
    await throwHttpError(
      logger,
      error,
      `Failed to create event metadata "${value.eventCode}"`,
    );
  }
}

/** Creates a registration that delivers the given events of a provider to a runtime action. */
export async function createRegistration(
  value: ValueOf<"registration">,
  providerId: string,
  context: EventsExecutionContext,
): Promise<void> {
  const { ioEventsClient, logger, params } = context;
  try {
    await ioEventsClient.createRegistration({
      ...workspaceOf(context),
      clientId: resolveImsAuthParams(params).clientId,
      deliveryType: "webhook",
      description: value.description,
      enabled: true,
      eventsOfInterest: value.eventCodes.map((eventCode) => ({
        eventCode,
        providerId,
      })),
      name: value.name,
      runtimeAction: value.runtimeAction,
    });

    logger.info(`Created registration "${value.name}".`);
  } catch (error) {
    await throwHttpError(
      logger,
      error,
      `Failed to create registration "${value.name}"`,
    );
  }
}

/** Subscribes a Commerce event under a provider with its target settings. */
export async function createSubscription(
  value: ValueOf<"subscription">,
  event: CommerceEvent,
  providerId: string,
  context: EventsExecutionContext,
): Promise<void> {
  const { commerceEventsClient, logger } = context;
  try {
    await commerceEventsClient.createEventSubscription({
      destination: event.destination,
      fields: event.fields,
      force: event.force,
      hipaa_audit_required: event.hipaa_audit_required,
      name: value.name,
      parent: event.name,
      priority: event.priority,
      provider_id: providerId,
      rules: event.rules,
    });

    logger.info(`Created Commerce event subscription "${value.name}".`);
  } catch (error) {
    await throwHttpError(
      logger,
      error,
      `Failed to create Commerce event subscription "${value.name}"`,
    );
  }

  await restoreEventMetadataText(
    getIoEventCode(value.name, COMMERCE_PROVIDER_TYPE),
    event,
    providerId,
    context,
  );
}

/** Sets the I/O metadata of a subscribed event back to its configured label and description. */
export async function restoreEventMetadataText(
  eventCode: string,
  event: Pick<CommerceEvent, "label" | "description">,
  providerId: string,
  context: EventsExecutionContext,
): Promise<void> {
  const { ioEventsClient, logger } = context;

  // Commerce overwrites the label and description of an event's I/O metadata when it subscribes.
  try {
    await ioEventsClient.updateEventMetadataForProvider({
      ...workspaceOf(context),
      description: event.description,
      eventCode,
      label: event.label,
      providerId,
    });
  } catch (error) {
    logger.warn(
      `Could not restore the label of event metadata "${eventCode}": ${await unwrapHttpError(error)}`,
    );
  }
}

/**
 * Ensures Commerce Eventing is configured with the given configuration, updating it if it already exists.
 * @param params - The parameters necessary to configure Commerce Eventing.
 * @param existingData - Existing Commerce Eventing data.
 */
export async function configureCommerceEventing(
  params: ConfigureCommerceEventingParams,
  existingData: Pick<
    ExistingCommerceEventingData,
    "isDefaultProviderConfigured" | "isDefaultWorkspaceConfigurationEmpty"
  >,
) {
  const { context, config } = params;
  const { commerceEventsClient, logger } = context;

  logger.info("Starting configuration of the Commerce Eventing Module");
  const updateParams = getCommerceEventingConfigurationUpdateParams(
    config,
    existingData,
  );

  if (updateParams === null) {
    logger.info(
      "Commerce Eventing Module is already configured, skipping configuration step.",
    );

    return;
  }

  logger.info(
    `Updating Commerce Eventing Module configuration with the following data: [${Object.keys(updateParams).join(", ")}]`,
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
    .catch((err) =>
      throwHttpError(
        logger,
        err,
        "Failed to configure Adobe Commerce eventing",
      ),
    );
}
