/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/** biome-ignore-all lint/performance/noBarrelFile: This is the package `commerce` entrypoint. */

export * from "./api/event-providers/endpoints";
export * from "./api/event-subscriptions/endpoints";
export * from "./api/eventing-configuration/endpoints";
export * from "./lib/api-client";

export type * from "./api/event-providers/schema";
export type {
  CommerceEventProvider,
  CommerceEventProviderManyResponse,
  CommerceEventProviderOneResponse,
} from "./api/event-providers/types";
export type * from "./api/event-subscriptions/schema";
export type {
  CommerceEventSubscription,
  CommerceEventSubscriptionField,
  CommerceEventSubscriptionManyResponse,
  CommerceEventSubscriptionOneResponse,
  CommerceEventSubscriptionRule,
} from "./api/event-subscriptions/types";
export type * from "./api/eventing-configuration/schema";
