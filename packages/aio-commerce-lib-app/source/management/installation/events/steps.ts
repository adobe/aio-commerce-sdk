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

import type { EventsContext } from "./utils";

export function createProviders(context: EventsContext) {
  const { config, logger } = context;
  logger.info("Creating event providers in Commerce for config:", config);

  return [{ providerId: "TODO" }];
}

export function createMetadata(context: EventsContext) {
  const { config, logger } = context;
  logger.info(
    "Creating event metadata in Commerce for provider and config",
    config,
  );

  return [{ metadataId: "TODO" }];
}

export function createRegistrations(context: EventsContext) {
  const { config, logger } = context;
  logger.info("Creating event registrations in Commerce for config:", config);

  return [{ registrationId: "TODO" }];
}

export function configureCommerce(context: EventsContext) {
  const { config, logger } = context;
  logger.info("Configuring Commerce Eventing with config:", config);

  return { commerceConfigured: true };
}

export function createCommerceSubscriptions(context: EventsContext) {
  const { config, logger } = context;
  logger.info("Creating event subscriptions in Commerce for config:", config);

  return [{ subscriptionId: "TODO" }];
}
