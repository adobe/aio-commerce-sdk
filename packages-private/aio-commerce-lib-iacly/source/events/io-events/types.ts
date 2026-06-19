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

import type { EventProviderType } from "@adobe/aio-commerce-lib-events/io-events";

/** Desired state for an I/O Events provider declaration in app config. */
export type IoEventsProviderConfig = {
  readonly instanceId: string;
  readonly label: string;
  readonly description?: string;
  readonly providerType?: EventProviderType;
};

/** Desired state for an I/O Events event metadata declaration. */
export type IoEventsEventMetadataConfig = {
  readonly providerInstanceId: string;
  readonly event_code: string;
  readonly label: string;
  readonly description: string;
};

/** Desired state for an I/O Events registration declaration. */
export type IoEventsRegistrationConfig = {
  readonly name: string;
  readonly description?: string;
  readonly providerInstanceId: string;
  readonly eventCodes: readonly string[];
  readonly deliveryType: "webhook" | "webhook_batch" | "journal";
  readonly webhookUrl?: string;
};

/** Live state for event metadata — enriched with providerInstanceId and apiProviderId during list(). */
export type IoEventsEventMetadataState = {
  readonly providerInstanceId: string;
  readonly apiProviderId: string;
  readonly event_code: string;
  readonly label: string;
  readonly description?: string;
};

/** Top-level I/O Events config block in LibIaclyConfig. */
export type IoEventsConfig = {
  readonly providers: readonly IoEventsProviderConfig[];
  readonly eventMetadata: readonly IoEventsEventMetadataConfig[];
  readonly registrations: readonly IoEventsRegistrationConfig[];
};

/** Org context needed to call the I/O Events API. */
export type IoEventsOrgContext = {
  readonly consumerOrgId: string;
  readonly projectId: string;
  readonly workspaceId: string;
};
