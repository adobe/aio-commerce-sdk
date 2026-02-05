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
  EventProviderType,
  IoEventProvider,
} from "@adobe/aio-commerce-lib-events/io-events";
import type { ArrayElement } from "type-fest";
import type {
  AppEvent,
  CommerceEvent,
  EventProvider,
  ExternalEvent,
} from "#config/schema/eventing";
import type { ApplicationMetadata } from "#config/schema/metadata";
import type { onboardIoEvents } from "#management/installation/events/helpers";
import type { EventsExecutionContext } from "./utils";

// Combine EventProvider with its type for easier handling.
export type ProviderWithType = EventProvider & { type: EventProviderType };

export type CreateProviderParams = {
  context: EventsExecutionContext;
  provider: ProviderWithType & { instanceId: string };
};

export type CreateProviderEventsMetadataParams = {
  context: EventsExecutionContext;
  type: EventProviderType;
  provider: IoEventProvider;
  event: CommerceEvent | ExternalEvent;
};

export type AppEventWithoutRuntimeActions = Omit<
  CommerceEvent | ExternalEvent,
  "runtimeActions"
>;

export type CreateRegistrationParams = {
  context: EventsExecutionContext;
  events: AppEventWithoutRuntimeActions[];
  provider: IoEventProvider;
  runtimeAction: string;
};

export type OnboardIoEventsParams<
  EventType extends CommerceEvent | ExternalEvent,
> = {
  context: EventsExecutionContext;
  metadata: ApplicationMetadata;
  provider: EventProvider;
  events: EventType[];
  providerType: EventProviderType;
};

/**
 * Extracts a nested property type from an async function's return type.
 * @example
 * type ProviderData = AwaitedPropertyOf<typeof onboardIoEvents, "providerData">;
 * type EventsData = AwaitedPropertyOf<typeof onboardIoEvents, "eventsData">;
 */
export type AwaitedPropertyOf<
  TFunc extends (...args: never[]) => unknown,
  TKey extends keyof Awaited<ReturnType<TFunc>>,
> = Awaited<ReturnType<TFunc>>[TKey];

export type ProviderDataFromIo = AwaitedPropertyOf<
  typeof onboardIoEvents,
  "providerData"
>;

export type EventsDataFromIo<EventType extends CommerceEvent | ExternalEvent> =
  Awaited<ReturnType<typeof onboardIoEvents<EventType>>>["eventsData"];

export type CreateSubscriptionParams = {
  context: EventsExecutionContext;
  metadata: ApplicationMetadata;
  provider: ProviderDataFromIo;
  event: ArrayElement<EventsDataFromIo<CommerceEvent>>;
};

export type OnboardCommerceEventSubscriptionParams = {
  context: EventsExecutionContext;
  metadata: ApplicationMetadata;
  provider: EventProvider;
  data: ProviderDataFromIo & {
    events: EventsDataFromIo<CommerceEvent>;
  };
};
