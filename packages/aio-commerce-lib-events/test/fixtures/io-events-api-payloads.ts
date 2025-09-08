import type { Options } from "ky";
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
  },
] as const;
