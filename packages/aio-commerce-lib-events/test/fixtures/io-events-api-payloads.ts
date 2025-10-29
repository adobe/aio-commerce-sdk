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

import type { Options } from "@adobe/aio-commerce-lib-api/ky";
import type { createAdobeIoEventsApiClient } from "#io-events/index";

type AdobeIoEventsApiClient = ReturnType<typeof createAdobeIoEventsApiClient>;

export const ADOBE_IO_EVENTS_API_PAYLOADS = [
  {
    name: "getAllEventProviders",
    method: "GET",
    pathname: "consumer-org-1/providers",

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.getAllEventProviders(
        { consumerOrgId: "consumer-org-1" },
        fetchOptions,
      );
    },

    hasInputValidation: true,
    hasCamelCaseTransformer: true,
  },
  {
    name: "getEventProviderById",
    method: "GET",
    pathname: "providers/provider-1",

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.getEventProviderById(
        {
          providerId: "provider-1",
        },
        fetchOptions,
      );
    },

    hasInputValidation: true,
    hasCamelCaseTransformer: true,
  },
  {
    name: "createEventProvider",
    method: "POST",
    pathname: "consumer-org-1/project-1/workspace-1/providers",

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.createEventProvider(
        {
          consumerOrgId: "consumer-org-1",
          projectId: "project-1",
          workspaceId: "workspace-1",
          instanceId: "instance-1",
          label: "Provider 1",
          description: "Provider 1 description",
        },
        fetchOptions,
      );
    },

    hasInputValidation: true,
    hasCamelCaseTransformer: true,
  },
  {
    name: "getAllCommerceEventProviders",
    method: "GET",
    pathname: "consumer-org-1/providers",

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.getAllCommerceEventProviders(
        { consumerOrgId: "consumer-org-1" },
        fetchOptions,
      );
    },

    hasInputValidation: true,
    hasCamelCaseTransformer: true,
  },
  {
    name: "getAll3rdPartyCustomEventProviders",
    method: "GET",
    pathname: "consumer-org-1/providers",

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.getAll3rdPartyCustomEventProviders(
        { consumerOrgId: "consumer-org-1" },
        fetchOptions,
      );
    },

    hasInputValidation: true,
    hasCamelCaseTransformer: true,
  },
  {
    name: "createCommerceEventProvider",
    method: "POST",
    pathname: "consumer-org-1/project-1/workspace-1/providers",

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.createCommerceEventProvider(
        {
          consumerOrgId: "consumer-org-1",
          projectId: "project-1",
          workspaceId: "workspace-1",
          instanceId: "instance-1",
          label: "Provider 1",
          description: "Provider 1 description",
        },
        fetchOptions,
      );
    },

    hasInputValidation: true,
    hasCamelCaseTransformer: true,
  },
  {
    name: "create3rdPartyCustomEventProvider",
    method: "POST",
    pathname: "consumer-org-1/project-1/workspace-1/providers",

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.create3rdPartyCustomEventProvider(
        {
          consumerOrgId: "consumer-org-1",
          projectId: "project-1",
          workspaceId: "workspace-1",
          instanceId: "instance-1",
          label: "Provider 1",
          description: "Provider 1 description",
        },
        fetchOptions,
      );
    },

    hasInputValidation: true,
    hasCamelCaseTransformer: true,
  },
  {
    name: "getAllEventMetadataForProvider",
    method: "GET",
    pathname: "providers/provider-1/eventmetadata",

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.getAllEventMetadataForProvider(
        { providerId: "provider-1" },
        fetchOptions,
      );
    },

    hasInputValidation: true,
    hasCamelCaseTransformer: true,
  },
  {
    name: "getEventMetadataForEventAndProvider",
    method: "GET",
    pathname: "providers/provider-1/eventmetadata/event-1",

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.getEventMetadataForEventAndProvider(
        { providerId: "provider-1", eventCode: "event-1" },
        fetchOptions,
      );
    },

    hasInputValidation: true,
    hasCamelCaseTransformer: true,
  },
  {
    name: "createEventMetadataForProvider",
    method: "POST",
    pathname:
      "consumer-org-1/project-1/workspace-1/providers/provider-1/eventmetadata",

    invoke(client: AdobeIoEventsApiClient, fetchOptions?: Options) {
      return client.createEventMetadataForProvider(
        {
          consumerOrgId: "consumer-org-1",
          projectId: "project-1",
          workspaceId: "workspace-1",
          providerId: "provider-1",
          label: "Event 1",
          description: "Event 1 description",
          eventCode: "event-1",
        },
        fetchOptions,
      );
    },

    hasInputValidation: true,
    hasCamelCaseTransformer: true,
  },
] as const;
