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

import type { AdobeIoEventsHttpClient } from "@adobe/aio-commerce-lib-api";

/** Parameters required to publish a raw event to the I/O Events ingress. */
export type PublishRawEventParams<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> = {
  /** The I/O Events provider UUID. */
  providerId: string;
  /** The fully-qualified event code. */
  eventCode: string;
  /** The event payload. Must be a JSON object. */
  payload: TPayload;
};

/**
 * Publishes an event to the Adobe I/O Events ingress endpoint.
 *
 * Builds a CloudEvents 1.0 envelope and POSTs it directly to the ingress URL
 * configured on the HTTP client. The provider is identified via the CloudEvents
 * `source` field as `urn:uuid:{providerId}`. Authentication headers are applied
 * automatically from the client's IMS auth configuration.
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use for the request.
 * @param params - The resolved provider ID, event code, and payload.
 */
export async function publishRawEvent<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
>(
  httpClient: AdobeIoEventsHttpClient,
  params: PublishRawEventParams<TPayload>,
): Promise<void> {
  const { providerId, eventCode, payload } = params;

  const cloudEvent = {
    specversion: "1.0",
    id: globalThis.crypto.randomUUID(),
    source: `urn:uuid:${providerId}`,
    type: eventCode,
    time: new Date().toISOString(),
    datacontenttype: "application/json",
    data: payload,
  };

  // Extend the existing client so auth hooks are preserved but the prefix URL
  // points to the ingress endpoint rather than the management API.
  const ingressClient = httpClient.extend({
    prefixUrl: httpClient.config.ingressBaseUrl,
  });

  await ingressClient.post("", {
    body: JSON.stringify(cloudEvent),
    // The management client defaults to Accept: application/hal+json; the ingress
    // requires application/cloudevents+json and application/json respectively.
    headers: {
      "content-type": "application/cloudevents+json",
      Accept: "application/json",
    },
  });
}
