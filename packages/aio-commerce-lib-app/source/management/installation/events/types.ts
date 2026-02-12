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

import type { UpdateEventingConfigurationParams } from "@adobe/aio-commerce-lib-events/commerce";
import type {
  EventProviderType,
  IoEventProvider,
} from "@adobe/aio-commerce-lib-events/io-events";
import type { ArrayElement } from "type-fest";
import type {
  AppEvent,
  CommerceEvent,
  EventProvider,
} from "#config/schema/eventing";
import type { ApplicationMetadata } from "#config/schema/metadata";
import type { onboardIoEvents } from "#management/installation/events/helpers";
import type { EventsExecutionContext } from "./context";

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

/** Event data with runtime actions omitted.  */
export type AppEventWithoutRuntimeActions = Omit<AppEvent, "runtimeActions">;

/** Parameters needed to create event event registrations in Adobe I/O Events. */
export type CreateRegistrationParams = {
  context: EventsExecutionContext;
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

/** The parameters needed to update the eventing module in Commerce. */
export type ConfigureCommerceEventingParams = {
  context: EventsExecutionContext;
  config: UpdateEventingConfigurationParams;
};

/** The parameters needed to create an event provider in Commerce */
export type CreateCommerceProviderParams = {
  context: EventsExecutionContext;
  provider: Pick<
    IoEventProvider,
    "label" | "description" | "instance_id" | "id"
  > & { workspaceConfiguration: string };
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
