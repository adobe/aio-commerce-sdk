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

import type {
  IoEventMetadataOneResponse,
  IoEventProviderOneResponse,
  IoEventRegistrationOneResponse,
} from "@adobe/aio-commerce-lib-events/io-events";

export const DEFAULT_PROVIDER_ID = "test-provider-id-1234-5678-abcd";
export const DEFAULT_CLIENT_ID = "test-client-id-9876543210";
export const DEFAULT_INSTANCE_ID =
  "app-management-debug-test-add-events-my-commerce-provider-test-workspace-123";

/**
 * Creates a mock IoEventProvider with the structure from the sample registration data.
 */
export function createMockIoEventProvider(
  overrides?: Partial<IoEventProviderOneResponse>,
): IoEventProviderOneResponse {
  return {
    id: DEFAULT_PROVIDER_ID,
    instance_id: DEFAULT_INSTANCE_ID,
    label: "My Commerce Provider",
    source: `urn:uuid:${DEFAULT_PROVIDER_ID}`,
    publisher: "Adobe Commerce",
    provider_metadata: "dx_commerce_events",
    event_delivery_format: "cloud_events_v1",
    description: "My Commerce Provider",
    docs_url: "https://developer.adobe.com/commerce/extensibility/events/",
    _links: {
      self: { href: `/providers/${DEFAULT_PROVIDER_ID}` },
      "rel:eventmetadata": {
        href: `/providers/${DEFAULT_PROVIDER_ID}/eventmetadata`,
      },
    },
    ...overrides,
  };
}

/**
 * Creates a mock IoEventMetadata for a given event code.
 * The eventCode parameter is required since each metadata is unique by event code.
 */
export function createMockIoEventMetadata(
  eventCode: string,
  overrides?: Partial<IoEventMetadataOneResponse>,
): IoEventMetadataOneResponse {
  const eventLabel = overrides?.label ?? `event${eventCode}`;
  const eventDescription = overrides?.description ?? `event ${eventCode}`;

  return {
    event_code: eventCode,
    label: eventLabel,
    description: eventDescription,
    _links: {
      self: { href: `/eventmetadata/${eventCode}` },
    },
    ...overrides,
  };
}

/**
 * Creates a mock IoEventRegistration with the full structure from the sample data.
 * This matches the registration structure from the user's sample.
 */
export function createMockIoEventRegistration(
  overrides?: Partial<IoEventRegistrationOneResponse>,
): IoEventRegistrationOneResponse {
  const defaultEventCode =
    "com.adobe.commerce.app-management-debug-test-add-events.observer.catalog_product_save_commit_after";

  return {
    id: "test-registration-12345",
    name: "Commerce Event Registration: Handle Event (My Package)",
    description:
      "Registration for handling commerce events with My Package runtime action",
    client_id: DEFAULT_CLIENT_ID,
    registration_id: "test-reg-id-abc-123",
    status: "ACTIVE",
    type: "APP",
    integration_status: "ENABLED",
    events_of_interest: [
      {
        event_code: defaultEventCode,
        provider_id: DEFAULT_PROVIDER_ID,
      },
    ],
    created_date: "2026-03-12T15:51:21.000Z",
    updated_date: "2026-03-12T15:51:22.000Z",
    webhook_url:
      "https://runtime.adobe.io/api/v1/web/test-workspace/test-project/sync_event_handler",
    delivery_type: "webhook",
    runtime_action: "my-package/handle-event",
    enabled: true,
    subscriber_filters: [],
    _links: {
      "rel:events": {
        href: "https://events.example.com/organizations/test-org-123/integrations/test-integration-456/test-reg-id-abc-123",
      },
      self: {
        href: "https://api.example.com/events/test-org-123/test-project-456/test-workspace-789/registrations/test-reg-id-abc-123",
      },
    },
    ...overrides,
  };
}
