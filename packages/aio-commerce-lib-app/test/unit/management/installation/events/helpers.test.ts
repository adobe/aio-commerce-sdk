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

import { beforeEach, describe, expect, test, vi } from "vitest";

import { onboardIoEvents } from "#management/installation/events/helpers";
import {
  createMockIoEventMetadata,
  createMockIoEventProvider,
  createMockIoEventRegistration,
  DEFAULT_PROVIDER_ID,
} from "#test/fixtures/installation/io-events";

import type { CommerceEvent } from "#config/schema/eventing";
import type { EventsExecutionContext } from "#management/installation/events/context";
import type { OnboardIoEventsParams } from "#management/installation/events/types";
import type { ExistingIoEventsData } from "#management/installation/events/utils";

const SAMPLE_METADATA = {
  id: "app-management-debug-test-add-events",
  displayName: "App Management Debug Unassociate",
  description: "This is a Debug for Commerce app management",
  version: "1.0.1",
};

const SAMPLE_PROVIDER = {
  label: "My Commerce Provider",
  description: "My Commerce Provider",
  key: "my-commerce-provider",
};

const SAMPLE_EVENTS: CommerceEvent[] = [
  {
    name: "observer.catalog_product_save_commit_after",
    label: "Catalog Product Save Commit After",
    description: "Catalog Product Save Commit After Event",
    fields: [{ name: "name" }, { name: "price" }],
    runtimeActions: ["my-package/handle-event"],
    priority: true,
  },
  {
    name: "observer.catalog_product_delete_commit_after",
    label: "Catalog Product Delete Commit After",
    description: "Catalog Product Delete Commit After Event",
    fields: [{ name: "name" }, { name: "price" }],
    runtimeActions: ["my-package/handle-event"],
    priority: true,
  },
];

function makeContext(): EventsExecutionContext {
  return {
    appData: {
      consumerOrgId: "test-org-123",
      projectId: "test-project-456",
      workspaceId: "test-workspace-123",
      orgName: "Test Org",
      projectName: "Test Project",
      projectTitle: "Test Project Title",
      workspaceName: "Test Workspace",
      workspaceTitle: "Test Workspace Title",
    },
    params: {
      AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id-9876543210",
      AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: "test-secret",
      AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
    },
    ioEventsClient: {
      createEventProvider: vi.fn(),
      createEventMetadataForProvider: vi.fn(),
      createRegistration: vi.fn(),
      deleteRegistration: vi.fn(),
      updateRegistration: vi.fn(),
    },
    commerceEventsClient: {} as never,
    logger: {
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    },
  } as unknown as EventsExecutionContext;
}

describe("onboardIoEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("creates provider, metadata, and registration when nothing exists", async () => {
    const context = makeContext();
    const eventCode1 =
      "com.adobe.commerce.app-management-debug-test-add-events.observer.catalog_product_save_commit_after";
    const eventCode2 =
      "com.adobe.commerce.app-management-debug-test-add-events.observer.catalog_product_delete_commit_after";

    const provider = createMockIoEventProvider();
    const metadata1 = createMockIoEventMetadata(eventCode1);
    const metadata2 = createMockIoEventMetadata(eventCode2);
    const registration = createMockIoEventRegistration({
      events_of_interest: [
        {
          event_code: eventCode1,
          provider_id: DEFAULT_PROVIDER_ID,
        },
        {
          event_code: eventCode2,
          provider_id: DEFAULT_PROVIDER_ID,
        },
      ],
    });

    vi.mocked(context.ioEventsClient.createEventProvider).mockResolvedValue(
      provider,
    );
    vi.mocked(context.ioEventsClient.createEventMetadataForProvider)
      .mockResolvedValueOnce(metadata1)
      .mockResolvedValueOnce(metadata2);
    vi.mocked(context.ioEventsClient.createRegistration).mockResolvedValue(
      registration,
    );

    const params: OnboardIoEventsParams<CommerceEvent> = {
      context,
      metadata: SAMPLE_METADATA,
      provider: SAMPLE_PROVIDER,
      events: SAMPLE_EVENTS,
      providerType: "dx_commerce_events",
    };

    const existingData: ExistingIoEventsData = {
      providersWithMetadata: [],
      registrations: [],
    };

    const result = await onboardIoEvents(params, existingData);

    // Verify provider was created once with correct instanceId pattern
    expect(context.ioEventsClient.createEventProvider).toHaveBeenCalledOnce();
    expect(context.ioEventsClient.createEventProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        instanceId:
          "app-management-debug-test-add-events-my-commerce-provider-test-workspace-123",
        label: "My Commerce Provider",
        providerType: "dx_commerce_events",
      }),
    );

    // Verify metadata was created twice (once for each event)
    expect(
      context.ioEventsClient.createEventMetadataForProvider,
    ).toHaveBeenCalledTimes(2);

    // Verify registration was created once (both events share same runtime action)
    expect(context.ioEventsClient.createRegistration).toHaveBeenCalledOnce();
    const registrationCall = vi.mocked(
      context.ioEventsClient.createRegistration,
    ).mock.calls[0][0];
    expect(registrationCall.eventsOfInterest).toHaveLength(2);
    expect(registrationCall.eventsOfInterest).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventCode: eventCode1 }),
        expect.objectContaining({ eventCode: eventCode2 }),
      ]),
    );

    // Verify updateRegistration was NOT called
    expect(context.ioEventsClient.updateRegistration).not.toHaveBeenCalled();

    // Verify result structure
    expect(result.providerData).toEqual(provider);
    expect(result.eventsData).toHaveLength(2);
    expect(result.eventsData[0].data.metadata).toEqual(metadata1);
    expect(result.eventsData[0].data.registrations).toEqual([registration]);
    expect(result.eventsData[1].data.metadata).toEqual(metadata2);
    expect(result.eventsData[1].data.registrations).toEqual([registration]);
  });

  test("gets provider and metadata, updates existing registration with missing event", async () => {
    const context = makeContext();
    const eventCode1 =
      "com.adobe.commerce.app-management-debug-test-add-events.observer.catalog_product_save_commit_after";
    const eventCode2 =
      "com.adobe.commerce.app-management-debug-test-add-events.observer.catalog_product_delete_commit_after";

    const provider = createMockIoEventProvider();
    const metadata1 = createMockIoEventMetadata(eventCode1);
    const metadata2 = createMockIoEventMetadata(eventCode2);

    // Existing registration has only one event
    const existingRegistration = createMockIoEventRegistration({
      events_of_interest: [
        {
          event_code: eventCode1,
          provider_id: DEFAULT_PROVIDER_ID,
        },
      ],
    });

    // Updated registration will have both events
    const updatedRegistration = createMockIoEventRegistration({
      events_of_interest: [
        {
          event_code: eventCode1,
          provider_id: DEFAULT_PROVIDER_ID,
        },
        {
          event_code: eventCode2,
          provider_id: DEFAULT_PROVIDER_ID,
        },
      ],
    });

    vi.mocked(context.ioEventsClient.updateRegistration).mockResolvedValue(
      updatedRegistration,
    );

    const params: OnboardIoEventsParams<CommerceEvent> = {
      context,
      metadata: SAMPLE_METADATA,
      provider: SAMPLE_PROVIDER,
      events: SAMPLE_EVENTS,
      providerType: "dx_commerce_events",
    };

    const existingData: ExistingIoEventsData = {
      providersWithMetadata: [
        {
          ...provider,
          metadata: [
            { ...metadata1, sample: null },
            { ...metadata2, sample: null },
          ],
        },
      ],
      registrations: [existingRegistration],
    };

    const result = await onboardIoEvents(params, existingData);

    // Verify provider was NOT created (reused existing)
    expect(context.ioEventsClient.createEventProvider).not.toHaveBeenCalled();

    // Verify metadata was NOT created (both already exist)
    expect(
      context.ioEventsClient.createEventMetadataForProvider,
    ).not.toHaveBeenCalled();

    // Verify registration was NOT created
    expect(context.ioEventsClient.createRegistration).not.toHaveBeenCalled();

    // Verify updateRegistration WAS called once
    expect(context.ioEventsClient.updateRegistration).toHaveBeenCalledOnce();
    const updateCall = vi.mocked(context.ioEventsClient.updateRegistration).mock
      .calls[0][0];
    expect(updateCall.registrationId).toBe(
      existingRegistration.registration_id,
    );
    expect(updateCall.eventsOfInterest).toHaveLength(2);
    expect(updateCall.eventsOfInterest).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventCode: eventCode1 }),
        expect.objectContaining({ eventCode: eventCode2 }),
      ]),
    );

    // Verify result uses updated registration
    expect(result.eventsData[0].data.registrations).toEqual([
      updatedRegistration,
    ]);
    expect(result.eventsData[1].data.registrations).toEqual([
      updatedRegistration,
    ]);
  });

  test("gets provider and metadata, creates registration when none exists", async () => {
    const context = makeContext();
    const eventCode1 =
      "com.adobe.commerce.app-management-debug-test-add-events.observer.catalog_product_save_commit_after";
    const eventCode2 =
      "com.adobe.commerce.app-management-debug-test-add-events.observer.catalog_product_delete_commit_after";

    const provider = createMockIoEventProvider();
    const metadata1 = createMockIoEventMetadata(eventCode1);
    const metadata2 = createMockIoEventMetadata(eventCode2);
    const registration = createMockIoEventRegistration({
      events_of_interest: [
        {
          event_code: eventCode1,
          provider_id: DEFAULT_PROVIDER_ID,
        },
        {
          event_code: eventCode2,
          provider_id: DEFAULT_PROVIDER_ID,
        },
      ],
    });

    vi.mocked(context.ioEventsClient.createRegistration).mockResolvedValue(
      registration,
    );

    const params: OnboardIoEventsParams<CommerceEvent> = {
      context,
      metadata: SAMPLE_METADATA,
      provider: SAMPLE_PROVIDER,
      events: SAMPLE_EVENTS,
      providerType: "dx_commerce_events",
    };

    const existingData: ExistingIoEventsData = {
      providersWithMetadata: [
        {
          ...provider,
          metadata: [
            { ...metadata1, sample: null },
            { ...metadata2, sample: null },
          ],
        },
      ],
      registrations: [],
    };

    const result = await onboardIoEvents(params, existingData);

    // Verify provider was NOT created
    expect(context.ioEventsClient.createEventProvider).not.toHaveBeenCalled();

    // Verify metadata was NOT created
    expect(
      context.ioEventsClient.createEventMetadataForProvider,
    ).not.toHaveBeenCalled();

    // Verify registration WAS created once with both events
    expect(context.ioEventsClient.createRegistration).toHaveBeenCalledOnce();
    const createCall = vi.mocked(context.ioEventsClient.createRegistration).mock
      .calls[0][0];
    expect(createCall.eventsOfInterest).toHaveLength(2);
    expect(createCall.eventsOfInterest).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventCode: eventCode1 }),
        expect.objectContaining({ eventCode: eventCode2 }),
      ]),
    );

    // Verify updateRegistration was NOT called
    expect(context.ioEventsClient.updateRegistration).not.toHaveBeenCalled();

    // Verify result structure
    expect(result.providerData).toEqual({
      ...provider,
      metadata: [
        { ...metadata1, sample: null },
        { ...metadata2, sample: null },
      ],
    });
    expect(result.eventsData).toHaveLength(2);
    expect(result.eventsData[0].data.metadata).toEqual({
      ...metadata1,
      sample: null,
    });
    expect(result.eventsData[0].data.registrations).toEqual([registration]);
    expect(result.eventsData[1].data.metadata).toEqual({
      ...metadata2,
      sample: null,
    });
    expect(result.eventsData[1].data.registrations).toEqual([registration]);
  });
});
