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

import { CommerceSdkErrorBase } from "@adobe/aio-commerce-lib-core/error";

import type { CommerceSdkErrorBaseOptions } from "@adobe/aio-commerce-lib-core/error";

/**
 * Thrown when a runtime action needs the app's stored association record but it
 * is missing or incomplete — for example, when the app has never been
 * associated, has been unassociated, or was associated by an older SDK that did
 * not store the data being read.
 *
 * Re-associating the app resolves the error.
 *
 * @example
 * ```ts
 * import { getCommerceClient, AssociationRecordNotFoundError } from "@adobe/aio-commerce-lib-app";
 * import { resolveImsAuthParams } from "@adobe/aio-commerce-lib-auth";
 *
 * try {
 *   const client = await getCommerceClient(resolveImsAuthParams(params));
 *   // ... use client
 * } catch (error) {
 *   if (error instanceof AssociationRecordNotFoundError) {
 *     // handle the unassociated case (e.g. return a 400 response)
 *   }
 *   throw error;
 * }
 * ```
 */
export class AssociationRecordNotFoundError extends CommerceSdkErrorBase {
  public constructor(
    message = "No association record was found for this app. Re-associate the app to resolve this error.",
    options?: CommerceSdkErrorBaseOptions,
  ) {
    super(message, options);
  }
}

/**
 * Base error thrown by {@link publishEvent} when event resolution or publishing fails.
 * Catch this to handle all publish-event failures in a single clause.
 */
export class PublishEventError extends CommerceSdkErrorBase {}

/**
 * Thrown when {@link publishEvent} cannot find the eventing installation data in system storage.
 *
 * This typically means the app installation has not run yet, or ran with an older SDK version
 * that did not write event provider metadata to storage. Re-running the installation resolves it.
 *
 * @example
 * ```ts
 * try {
 *   await publishEvent({ client, provider: "order-events", event: "order.created", payload });
 * } catch (error) {
 *   if (error instanceof EventsDataNotInitializedError) {
 *     // Prompt re-installation
 *   }
 * }
 * ```
 */
export class EventsDataNotInitializedError extends PublishEventError {
  public constructor(options?: CommerceSdkErrorBaseOptions) {
    super(
      "No eventing installation data found. Re-run the app installation to initialize event provider metadata.",
      options,
    );
  }
}

/**
 * Thrown when the provider key passed to {@link publishEvent} does not match any provider
 * declared in the app's eventing configuration.
 *
 * @example
 * ```ts
 * try {
 *   await publishEvent({ client, provider: "order-events", event: "order.created", payload });
 * } catch (error) {
 *   if (error instanceof ProviderNotFoundError) {
 *     // "order-events" was not found — check app.commerce.config.ts
 *   }
 * }
 * ```
 */
export class ProviderNotFoundError extends PublishEventError {
  public constructor(
    providerKey: string,
    options?: CommerceSdkErrorBaseOptions,
  ) {
    super(
      `No event provider with key '${providerKey}' found in the app eventing configuration.`,
      options,
    );
  }
}

/**
 * Thrown when the event name passed to {@link publishEvent} does not match any event
 * declared under the given provider in the app's eventing configuration.
 *
 * @example
 * ```ts
 * try {
 *   await publishEvent({ client, provider: "order-events", event: "order.created", payload });
 * } catch (error) {
 *   if (error instanceof EventNotFoundError) {
 *     // "order.created" was not found under "order-events" — check app.commerce.config.ts
 *   }
 * }
 * ```
 */
export class EventNotFoundError extends PublishEventError {
  public constructor(
    eventName: string,
    providerKey: string,
    options?: CommerceSdkErrorBaseOptions,
  ) {
    super(
      `No event named '${eventName}' found under provider '${providerKey}'.`,
      options,
    );
  }
}
