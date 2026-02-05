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
import type { ApplicationMetadata } from "#config/index";
import type {
  AppEvent,
  CommerceEvent,
  EventProvider,
  ExternalEvent,
} from "#config/schema/eventing";
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

export type AppEventWithoutRuntimeAction = Omit<
  CommerceEvent | ExternalEvent,
  "runtimeAction"
>;

export type CreateRegistrationParams = {
  context: EventsExecutionContext;
  events: AppEventWithoutRuntimeAction[];
  provider: IoEventProvider;
  runtimeAction: string;
};

export type OnboardIoEventsParams = {
  context: EventsExecutionContext;
  metadata: ApplicationMetadata;
  provider: EventProvider;
  events: AppEvent[];
  providerType: EventProviderType;
};
