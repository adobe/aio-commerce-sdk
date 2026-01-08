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

/** biome-ignore-all lint/performance/noBarrelFile: This is the package `io-events` entrypoint. */

export * from "./api/event-metadata/endpoints";
export * from "./api/event-providers/endpoints";
export * from "./api/event-providers/shorthands";
export * from "./api/event-registrations/endpoints";
export * from "./lib/api-client";

export type * from "./api/event-metadata/schema";
export type {
  IoEventMetadata,
  IoEventMetadataManyResponse,
  IoEventMetadataOneResponse,
} from "./api/event-metadata/types";
export type * from "./api/event-providers/schema";
export type {
  IoEventProvider,
  IoEventProviderManyResponse,
  IoEventProviderOneResponse,
} from "./api/event-providers/types";
export type * from "./api/event-registrations/schema";
export type {
  IoEventRegistration,
  IoEventRegistrationManyResponse,
  IoEventRegistrationOneResponse,
  IoEventRegistrationPaginatedResponse,
  PageMetadata,
} from "./api/event-registrations/types";
