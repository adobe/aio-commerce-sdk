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
  public constructor() {
    super(
      "No eventing installation data found. Re-run the app installation to initialize event provider metadata.",
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
  public constructor(providerKey: string) {
    super(
      `No event provider with key '${providerKey}' found in the app eventing configuration.`,
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
  public constructor(eventName: string, providerKey: string) {
    super(
      `No event named '${eventName}' found under provider '${providerKey}'.`,
    );
  }
}
