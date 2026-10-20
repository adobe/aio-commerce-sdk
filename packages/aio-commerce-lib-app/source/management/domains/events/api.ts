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

import { resolveImsAuthParams } from "@adobe/aio-commerce-lib-auth";
import { HTTPError } from "ky";

import {
  isHttpNotFoundError,
  throwHttpError,
} from "#management/common/utils/http-error";

import type { CommerceEvent } from "#config/schema/eventing";
import type { EventsExecutionContext } from "./context";
import type { EventingOperationValue } from "./types";

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

/**
 * Updates a Commerce subscription in place, or unsubscribes it for a replace: the install pass
 * that follows subscribes it again with the target settings.
 */
export async function updateSubscription(
  after: ValueOf<"subscription">,
  targetEvents: Map<string, CommerceEvent>,
  context: EventsExecutionContext,
): Promise<void> {
  if (after.changeMode === "replace") {
    return await deleteSubscription(after.name, context);
  }

  const { commerceEventsClient, logger } = context;
  const event = targetEvents.get(after.name);

  if (!event) {
    throw new Error(
      `Commerce subscription "${after.name}" is not in the target configuration.`,
    );
  }

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
