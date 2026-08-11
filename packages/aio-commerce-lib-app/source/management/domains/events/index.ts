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

/** biome-ignore-all lint/performance/noBarrelFile: Convenience entrypoint for the events module */

export { eventingStep } from "./branch";
export { commerceEventsStep } from "./commerce";
export { createEventsStepContext } from "./context";
export {
  COMMERCE_SUBSCRIPTION_DOMAIN,
  eventingDomainCollectors,
  IO_EVENTS_METADATA_DOMAIN,
  IO_EVENTS_PROVIDER_DOMAIN,
  IO_EVENTS_REGISTRATION_DOMAIN,
} from "./diff";
export { externalEventsStep } from "./external";
export { eventingUpgradeDomain, reconcileEventing } from "./reconcile";

export type { EventsStepContext } from "./context";
export type {
  EventingReconcileResult,
  ReconcileEventingOptions,
} from "./reconcile";
