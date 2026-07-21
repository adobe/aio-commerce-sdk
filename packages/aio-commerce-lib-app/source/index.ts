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

/**
 * Public entrypoint for `@adobe/aio-commerce-lib-app`. Exposes helpers that
 * runtime actions use to retrieve the Commerce instance the app is currently
 * associated with.
 *
 * @packageDocumentation
 */

// biome-ignore lint/performance/noBarrelFile: export as part of the Public API
export {
  getCommerceClient,
  getCommerceInstance,
} from "./lib/commerce";
export {
  AssociationRecordNotFoundError,
  EventNotFoundError,
  EventsDataNotInitializedError,
  ProviderNotFoundError,
  PublishEventError,
} from "./lib/errors";
export { publishEvent, resolveIoEventCode } from "./lib/events";

export type { AssociatedCommerceData } from "./management/association/types";
