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

import type { AppConfigWithDefinedEvents, EventsPhaseContext } from "./utils";

export function createProviders(
  _ctx: EventsPhaseContext,
  _config: AppConfigWithDefinedEvents,
) {
  return { providerId: "TODO", label: "TODO" };
}

export function createMetadata(_ctx: EventsPhaseContext, _providerId: string) {
  return { metadataId: "TODO" };
}

export function createRegistrations(
  _ctx: EventsPhaseContext,
  _providerId: string,
  _metadataId: string,
) {
  return { registrationId: "TODO" };
}

export function configureCommerce(
  _ctx: EventsPhaseContext,
  _providerId: string,
) {
  return { commerceConfigured: true };
}

export function createCommerceSubscriptions(
  _ctx: EventsPhaseContext,
  _providerId: string,
) {
  return { subscriptionId: "TODO" };
}
