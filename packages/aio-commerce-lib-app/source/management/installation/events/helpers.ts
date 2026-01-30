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

import type { EventProvider } from "#config/schema/eventing";
import type { EventsExecutionContext } from "./utils";

export function createProviders(
  context: EventsExecutionContext,
  providers: EventProvider[],
) {
  const { logger } = context;
  logger.info("Creating event providers", providers);

  return [{ providerId: "TODO" }];
}

export function createMetadata(context: EventsExecutionContext) {
  const { logger } = context;
  logger.info("Creating event metadata for provider");

  return [{ metadataId: "TODO" }];
}

export function createRegistrations(context: EventsExecutionContext) {
  const { logger } = context;
  logger.info("Creating event registrations");

  return [{ registrationId: "TODO" }];
}

export function configureCommerce(context: EventsExecutionContext) {
  const { logger } = context;
  logger.info("Configuring Commerce Eventing");

  return { commerceConfigured: true };
}

export function createCommerceSubscriptions(context: EventsExecutionContext) {
  const { logger } = context;
  logger.info("Creating event subscriptions in Commerce");

  return [{ subscriptionId: "TODO" }];
}
