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

import type {
  CommerceEvent,
  CommerceEventSource,
  EventProvider,
} from "#config/schema/eventing";
import type { ApplicationMetadata } from "#config/schema/metadata";
import type { EventsExecutionContext } from "./utils";

export function createProviders(
  context: EventsExecutionContext,
  providers: EventProvider[],
) {
  const { logger } = context;
  logger.info("Creating event providers", providers);

  return [{ providerId: "TODO" }];
}

export function createMetadata(context: EventsExecutionContext) {
  const { logger } = context;
  logger.info("Creating event metadata for provider");

  return [{ metadataId: "TODO" }];
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

export function createCommerceSubscriptions(
  context: EventsExecutionContext,
  config: {
    metadata: ApplicationMetadata;
    eventSources: CommerceEventSource[];
  },
  providers: ReturnType<typeof createProviders>,
) {
  const { logger, commerceEventsClient } = context;
  const { metadata, eventSources } = config;
  logger.info("Creating event subscriptions in Commerce");

  //TODO: map providers by an instance id for easy lookup
  const providersMap = new Map(providers.map((p) => [p.providerId, p]));

  for (const source of eventSources) {
    //TODO: use the instance id or similar to lookup the provider created earlier
    const instanceId = source.provider.label;
    const provider = providersMap.get(instanceId);

    for (const event of source.events) {
      const namespacedEventName = getEventName(metadata.id, event);

      logger.info(
        `Creating subscription for event: ${namespacedEventName} with provider: ${provider?.providerId}`,
      );

      const eventSpec = {
        name: namespacedEventName,
        parent: event.name,
        fields: event.fields.map((field) => ({ name: field })),
        providerId: instanceId,
      };

      logger.info(
        `Creating event subscription for event: ${namespacedEventName}:${event.name}`,
      );

      commerceEventsClient.createEventSubscription(eventSpec);
    }
  }

  logger.info("Created commerce event subscriptions");

  return [{ subscriptionId: "TODO" }];
}

/**
 * Creates a fully qualified event name for Adobe Commerce events.
 * @param appId - The application ID
 * @param event - The Commerce event
 */
export function getEventName(appId: string, event: CommerceEvent) {
  return `com.adobe.commerce.${appId}.${event.name}`;
}
