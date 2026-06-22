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

/** biome-ignore-all lint/performance/noBarrelFile: This is the package API entrypoint. */

import type { AdminUiConfig } from "./admin-ui/types";
import type { CommerceEventsConfig } from "./events/commerce-events/types";
import type { IoEventsConfig } from "./events/io-events/types";
import type { WebhookConfig } from "./webhooks/types";

export { AdminUiProvider } from "./admin-ui/provider";
export { CommerceEventsProvider } from "./events/commerce-events/provider";
export { IoEventsOutputs } from "./events/io-events/outputs";
export { IOEventsProvider } from "./events/io-events/provider";
export { WebhooksProvider } from "./webhooks/provider";

export type {
  AdminUiConfig,
  AdminUiExtensionConfig,
  AdminUiExtensionState,
} from "./admin-ui/types";
export type {
  CommerceEventingSetupConfig,
  CommerceEventProviderConfig,
  CommerceEventSubscriptionConfig,
  CommerceEventsConfig,
} from "./events/commerce-events/types";
export type {
  IoEventsConfig,
  IoEventsEventMetadataConfig,
  IoEventsProviderConfig,
  IoEventsRegistrationConfig,
} from "./events/io-events/types";
export type { WebhookConfig } from "./webhooks/types";

export type LibIaclyConfig = {
  webhooks?: readonly WebhookConfig[];
  ioEvents?: IoEventsConfig;
  commerceEvents?: CommerceEventsConfig;
  adminUi?: AdminUiConfig;
};
