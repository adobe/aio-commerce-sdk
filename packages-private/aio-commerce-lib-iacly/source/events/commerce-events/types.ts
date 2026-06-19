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

/** The Commerce eventing setup/enable config (singleton per Commerce instance). */
export type CommerceEventingSetupConfig = {
  readonly instanceId: string;
  readonly merchantId: string;
  readonly environmentId: string;
};

/** Desired state for a Commerce-side event provider. */
export type CommerceEventProviderConfig = {
  /** The user-defined instance ID — matches the io-events/provider instanceId. */
  readonly ioEventsProviderInstanceId: string;
  readonly label?: string;
  readonly description?: string;
};

/** Desired state for a Commerce event subscription. */
export type CommerceEventSubscriptionConfig = {
  /** The event code to subscribe to (e.g. "observer.catalog_product_save_after"). */
  readonly eventCode: string;
  readonly fields?: ReadonlyArray<{
    readonly name: string;
    readonly value?: string;
  }>;
};

/** Top-level Commerce Events config block in LibIaclyConfig. */
export type CommerceEventsConfig = {
  readonly setup: CommerceEventingSetupConfig;
  readonly providers: readonly CommerceEventProviderConfig[];
  readonly subscriptions: readonly CommerceEventSubscriptionConfig[];
};
