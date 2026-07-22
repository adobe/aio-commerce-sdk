/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import type { Options } from "ky";
import type { createAdobeIoEventsApiClient } from "#io-events/index";

type AdobeIoEventsApiClient = ReturnType<typeof createAdobeIoEventsApiClient>;

export const ADOBE_IO_EVENTS_API_PAYLOADS = [
  {
    hasInputValidation: true,

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.getAllEventProviders(
        { consumerOrgId: "consumer-org-1" },
        fetchOptions,
      );
    },
    method: "GET",
    name: "getAllEventProviders",
    pathname: "consumer-org-1/providers",
  },
  {
    hasInputValidation: true,

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.getEventProviderById(
        {
          providerId: "provider-1",
        },
        fetchOptions,
      );
    },
    method: "GET",
    name: "getEventProviderById",
    pathname: "providers/provider-1",
  },
  {
    hasInputValidation: true,

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.createEventProvider(
        {
          consumerOrgId: "consumer-org-1",
          description: "Provider 1 description",
          instanceId: "instance-1",
          label: "Provider 1",
          projectId: "project-1",
          workspaceId: "workspace-1",
        },
        fetchOptions,
      );
    },
    method: "POST",
    name: "createEventProvider",
    pathname: "consumer-org-1/project-1/workspace-1/providers",
  },
  {
    hasInputValidation: true,

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.getAllCommerceEventProviders(
        { consumerOrgId: "consumer-org-1" },
        fetchOptions,
      );
    },
    method: "GET",
    name: "getAllCommerceEventProviders",
    pathname: "consumer-org-1/providers",
  },
  {
    hasInputValidation: true,

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.getAll3rdPartyCustomEventProviders(
        { consumerOrgId: "consumer-org-1" },
        fetchOptions,
      );
    },
    method: "GET",
    name: "getAll3rdPartyCustomEventProviders",
    pathname: "consumer-org-1/providers",
  },
  {
    hasInputValidation: true,

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.createCommerceEventProvider(
        {
          consumerOrgId: "consumer-org-1",
          description: "Provider 1 description",
          instanceId: "instance-1",
          label: "Provider 1",
          projectId: "project-1",
          workspaceId: "workspace-1",
        },
        fetchOptions,
      );
    },
    method: "POST",
    name: "createCommerceEventProvider",
    pathname: "consumer-org-1/project-1/workspace-1/providers",
  },
  {
    hasInputValidation: true,

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.create3rdPartyCustomEventProvider(
        {
          consumerOrgId: "consumer-org-1",
          description: "Provider 1 description",
          instanceId: "instance-1",
          label: "Provider 1",
          projectId: "project-1",
          workspaceId: "workspace-1",
        },
        fetchOptions,
      );
    },
    method: "POST",
    name: "create3rdPartyCustomEventProvider",
    pathname: "consumer-org-1/project-1/workspace-1/providers",
  },
  {
    hasInputValidation: true,

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.getAllEventMetadataForProvider(
        { providerId: "provider-1" },
        fetchOptions,
      );
    },
    method: "GET",
    name: "getAllEventMetadataForProvider",
    pathname: "providers/provider-1/eventmetadata",
  },
  {
    hasInputValidation: true,

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.getEventMetadataForEventAndProvider(
        { eventCode: "event-1", providerId: "provider-1" },
        fetchOptions,
      );
    },
    method: "GET",
    name: "getEventMetadataForEventAndProvider",
    pathname: "providers/provider-1/eventmetadata/event-1",
  },
  {
    hasInputValidation: true,

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.createEventMetadataForProvider(
        {
          consumerOrgId: "consumer-org-1",
          description: "Event 1 description",
          eventCode: "event-1",
          label: "Event 1",
          projectId: "project-1",
          providerId: "provider-1",
          workspaceId: "workspace-1",
        },
        fetchOptions,
      );
    },
    method: "POST",
    name: "createEventMetadataForProvider",
    pathname:
      "consumer-org-1/project-1/workspace-1/providers/provider-1/eventmetadata",
  },
  {
    hasInputValidation: true,

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.getAllRegistrationsByConsumerOrg(
        { consumerOrgId: "consumer-org-1" },
        fetchOptions,
      );
    },
    method: "GET",
    name: "getAllRegistrationsByConsumerOrg",
    pathname: "consumer-org-1/registrations",
  },
  {
    hasInputValidation: true,

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.getAllRegistrations(
        {
          consumerOrgId: "consumer-org-1",
          projectId: "project-1",
          workspaceId: "workspace-1",
        },
        fetchOptions,
      );
    },
    method: "GET",
    name: "getAllRegistrations",
    pathname: "consumer-org-1/project-1/workspace-1/registrations",
  },
  {
    hasInputValidation: true,

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.getRegistrationById(
        {
          consumerOrgId: "consumer-org-1",
          projectId: "project-1",
          registrationId: "registration-1",
          workspaceId: "workspace-1",
        },
        fetchOptions,
      );
    },
    method: "GET",
    name: "getRegistrationById",
    pathname:
      "consumer-org-1/project-1/workspace-1/registrations/registration-1",
  },
  {
    hasInputValidation: true,

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.createRegistration(
        {
          clientId: "client-1",
          consumerOrgId: "consumer-org-1",
          deliveryType: "webhook",
          description: "Test Description",
          eventsOfInterest: [
            {
              eventCode: "event-1",
              providerId: "provider-1",
            },
          ],
          name: "Test Registration",
          projectId: "project-1",
          subscriberFilters: [
            {
              name: "Test Filter",
              subscriberFilter: '{"key": "value"}',
            },
          ],
          webhookUrl: "https://example.com/webhook",
          workspaceId: "workspace-1",
        },
        fetchOptions,
      );
    },
    method: "POST",
    name: "createRegistration",
    pathname: "consumer-org-1/project-1/workspace-1/registrations",
  },
  {
    hasInputValidation: false,

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.createRegistration(
        {
          clientId: "client-1",
          consumerOrgId: "consumer-org-1",
          deliveryType: "aws_eventbridge",
          destinationMetadata: {
            awsAccountId: "123456789012",
            awsRegion: "us-east-1",
          },
          eventsOfInterest: [
            {
              eventCode: "event-1",
              providerId: "provider-1",
            },
          ],
          name: "AWS Registration",
          projectId: "project-1",
          workspaceId: "workspace-1",
        },
        fetchOptions,
      );
    },
    method: "POST",
    name: "createRegistration",
    pathname: "consumer-org-1/project-1/workspace-1/registrations",
  },
  {
    hasInputValidation: true,

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.updateRegistration(
        {
          clientId: "client-1",
          consumerOrgId: "consumer-org-1",
          deliveryType: "webhook",
          description: "Updated Description",
          eventsOfInterest: [
            {
              eventCode: "event-1",
              providerId: "provider-1",
            },
          ],
          name: "Updated Registration",
          projectId: "project-1",
          registrationId: "registration-1",
          subscriberFilters: [
            {
              name: "Updated Filter",
              subscriberFilter: '{"key": "updated"}',
            },
          ],
          webhookUrl: "https://example.com/webhook",
          workspaceId: "workspace-1",
        },
        fetchOptions,
      );
    },
    method: "PUT",
    name: "updateRegistration",
    pathname:
      "consumer-org-1/project-1/workspace-1/registrations/registration-1",
  },
  {
    hasInputValidation: false,

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.updateRegistration(
        {
          clientId: "client-1",
          consumerOrgId: "consumer-org-1",
          deliveryType: "aws_eventbridge",
          destinationMetadata: {
            awsAccountId: "987654321098",
            awsRegion: "eu-west-1",
          },
          eventsOfInterest: [
            {
              eventCode: "event-1",
              providerId: "provider-1",
            },
          ],
          name: "AWS Registration",
          projectId: "project-1",
          registrationId: "registration-1",
          workspaceId: "workspace-1",
        },
        fetchOptions,
      );
    },
    method: "PUT",
    name: "updateRegistration",
    pathname:
      "consumer-org-1/project-1/workspace-1/registrations/registration-1",
  },
  {
    hasInputValidation: true,

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.deleteRegistration(
        {
          consumerOrgId: "consumer-org-1",
          projectId: "project-1",
          registrationId: "registration-1",
          workspaceId: "workspace-1",
        },
        fetchOptions,
      );
    },
    method: "DELETE",
    name: "deleteRegistration",
    pathname:
      "consumer-org-1/project-1/workspace-1/registrations/registration-1",
  },
] as const;
