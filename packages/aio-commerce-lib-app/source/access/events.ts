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

import { getSystemConfigByKey } from "@adobe/aio-commerce-lib-config";

import { AssociationRecordNotFoundError } from "#errors/association-record-not-found-error";
import { getAssociationData } from "#management/association/association-repository";

import {
  EventNotFoundError,
  EventsDataNotInitializedError,
  ProviderNotFoundError,
} from "../errors/publish-event-errors";
import {
  COMMERCE_PROVIDER_TYPE,
  EVENTS_STORAGE_KEY,
  EXTERNAL_PROVIDER_TYPE,
  getIoEventCode,
  getNamespacedEvent,
} from "../management/installation/events/utils";

import type { AdobeIoEventsApiClient } from "@adobe/aio-commerce-lib-events/io-events";
import type { StoredEventsData } from "../management/installation/events/types";

/**
 * Publishes an event declared in the app's eventing configuration.
 *
 * Resolves the provider key and event name to their respective I/O Events IDs from
 * data written to system storage at installation time, then delegates the HTTP call
 * to the given client. No management API round-trip is needed at runtime.
 *
 * @param params.client - An {@link AdobeIoEventsApiClient} configured with the correct IMS auth.
 * @param params.provider - The `key` of an event provider declared in `app.commerce.config.ts`.
 * @param params.event - The `name` of an event within that provider.
 * @param params.payload - The event payload. Must be a JSON object.
 *
 * @throws {EventsDataNotInitializedError} If no eventing installation data is found in system storage.
 * @throws {ProviderNotFoundError} If the provider key is not found in the stored data.
 * @throws {EventNotFoundError} If the event name is not found under the given provider.
 *
 * @example
 * ```ts
 * import { publishEvent } from "@adobe/aio-commerce-lib-app";
 * import { createAdobeIoEventsApiClient } from "@adobe/aio-commerce-lib-events";
 * import { resolveImsAuthParams } from "@adobe/aio-commerce-lib-auth";
 *
 * export async function main(params) {
 *   const client = createAdobeIoEventsApiClient({
 *     auth: resolveImsAuthParams(params),
 *     config: { ingressBaseUrl: params.AIO_EVENTS_INGRESS_BASE_URL },
 *   });
 *
 *   await publishEvent({
 *     client,
 *     provider: "order-events",
 *     event: "order.created",
 *     payload: { orderId: "100000123", total: 149.99 },
 *   });
 * }
 * ```
 */
export async function publishEvent<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
>(params: {
  client: AdobeIoEventsApiClient;
  provider: string;
  event: string;
  payload: TPayload;
}): Promise<void> {
  const { client, provider: providerKey, event: eventName, payload } = params;

  const data = await getSystemConfigByKey<StoredEventsData>(EVENTS_STORAGE_KEY);
  if (!data) {
    throw new EventsDataNotInitializedError();
  }

  const providerEntry = data.providers[providerKey];
  if (!providerEntry) {
    throw new ProviderNotFoundError(providerKey);
  }

  const eventEntry = providerEntry.events[eventName];
  if (!eventEntry) {
    throw new EventNotFoundError(eventName, providerKey);
  }

  await client.publishEvent({
    eventCode: eventEntry.code,
    isPhiData: eventEntry.isPhiData,
    payload,
    providerId: providerEntry.id,
  });
}

/** The type of an event provider. */
export type EventProviderType = "commerce" | "external";

/**
 * Returns an app's full I/O Events event code for a given provider type and event name.
 *
 * @throws {AssociationRecordNotFoundError} If the app is not associated, was unassociated, or was associated
 * by an older SDK that did not store this data. Re-associating the app resolves the error.
 *
 * @param eventName - The name of the event.
 * @param providerType - The type of the event provider.
 *
 * @example
 * ```ts
 * import { getQualifiedEventCode } from "@adobe/aio-commerce-lib-app";
 *
 * export async function main() {
 *   // For an app whose metadata id is "my-app" (non-alphanumeric characters are
 *   // sanitized to "_" in the namespace segment):
 *   const commerceEventCode = await getQualifiedEventCode("observer.catalog_product_save_after", "commerce");
 *   // commerceEventCode === "com.adobe.commerce.my_app.observer.catalog_product_save_after"
 *
 *   const externalEventCode = await getQualifiedEventCode("my-custom-event", "external");
 *   // externalEventCode === "my_app.my-custom-event"
 * }
 * ```
 */
export async function getQualifiedEventCode(
  eventName: string,
  providerType: EventProviderType,
): Promise<string> {
  const data = await getAssociationData();
  const metadata = data?.app?.metadata;

  if (!metadata) {
    throw new AssociationRecordNotFoundError();
  }

  return getIoEventCode(
    getNamespacedEvent(metadata, eventName),
    providerType === "commerce"
      ? COMMERCE_PROVIDER_TYPE
      : EXTERNAL_PROVIDER_TYPE,
  );
}
