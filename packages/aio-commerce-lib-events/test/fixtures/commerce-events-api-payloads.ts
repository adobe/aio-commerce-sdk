import type { Options } from "ky";
import type { createCommerceEventsApiClient } from "#commerce/index";

type CommerceEventsApiClient = ReturnType<typeof createCommerceEventsApiClient>;

export const COMMERCE_EVENTS_API_PAYLOADS = [
  {
    name: "getAllEventProviders",
    method: "GET",
    pathname() {
      return "eventing/eventProvider";
    },

    invoke(client: CommerceEventsApiClient, fetchOptions?: Options) {
      return client.getAllEventProviders(fetchOptions);
    },

    invalidInvoke: null,
    mockResponse: {
      providers: [
        { provider_id: "provider-1", provider_name: "Provider 1" },
        { provider_id: "provider-2", provider_name: "Provider 2" },
      ],
    },

    actualResponse: {
      providers: [
        { providerId: "provider-1", providerName: "Provider 1" },
        { providerId: "provider-2", providerName: "Provider 2" },
      ],
    },
  },
  {
    name: "getEventProviderById",
    method: "GET",
    pathname() {
      return "eventing/eventProvider/provider-1";
    },

    invoke(client: CommerceEventsApiClient, fetchOptions?: Options) {
      return client.getEventProviderById(
        {
          providerId: "provider-1",
        },
        fetchOptions,
      );
    },

    invalidInvoke: (client: CommerceEventsApiClient) => {
      // @ts-expect-error - Testing invalid params
      return client.getEventProviderById("invalid-params");
    },

    mockResponse: {
      provider: { provider_id: "provider-1", provider_name: "Provider 1" },
    },

    actualResponse: {
      provider: { providerId: "provider-1", providerName: "Provider 1" },
    },
  },
  {
    name: "createEventProvider",
    method: "POST",
    pathname() {
      return "eventing/eventProvider";
    },

    invoke(client: CommerceEventsApiClient, fetchOptions?: Options) {
      return client.createEventProvider(
        {
          providerId: "provider-1",
          instanceId: "instance-1",
          label: "Provider 1",
          description: "Provider 1 description",
          associatedWorkspaceConfiguration: {},
        },
        fetchOptions,
      );
    },

    invalidInvoke: (client: CommerceEventsApiClient) => {
      // @ts-expect-error - Testing invalid params
      return client.createEventProvider("invalid-params");
    },

    mockResponse: {
      provider: { provider_id: "provider-1", provider_name: "Provider 1" },
    },

    actualResponse: {
      provider: { providerId: "provider-1", providerName: "Provider 1" },
    },
  },
  {
    name: "getAllEventSubscriptions",
    method: "GET",
    pathname() {
      return "eventing/getEventSubscriptions";
    },

    invoke(client: CommerceEventsApiClient, fetchOptions?: Options) {
      return client.getAllEventSubscriptions(fetchOptions);
    },

    invalidInvoke: null,
    mockResponse: {
      subscriptions: [{ name: "subscription-1", provider_id: "provider-1" }],
    },

    actualResponse: {
      subscriptions: [{ name: "subscription-1", providerId: "provider-1" }],
    },
  },
  {
    name: "createEventSubscription",
    method: "POST",
    pathname() {
      return "eventing/eventSubscribe";
    },

    invoke(client: CommerceEventsApiClient, fetchOptions?: Options) {
      return client.createEventSubscription(
        {
          name: "subscription-1",
          providerId: "provider-1",
          fields: [{ name: "field-1" }],
        },
        fetchOptions,
      );
    },

    invalidInvoke: (client: CommerceEventsApiClient) => {
      // @ts-expect-error - Testing invalid params
      return client.createEventSubscription("invalid-params");
    },

    mockResponse: {
      subscription: { name: "subscription-1", providerId: "provider-1" },
    },

    actualResponse: null,
  },
  {
    name: "updateEventingConfiguration",
    method: "PUT",
    pathname() {
      return "eventing/updateConfiguration";
    },

    invoke(client: CommerceEventsApiClient, fetchOptions?: Options) {
      return client.updateEventingConfiguration(
        {
          enabled: true,
        },
        fetchOptions,
      );
    },

    invalidInvoke: (client: CommerceEventsApiClient) => {
      // @ts-expect-error - Testing invalid params
      return client.updateEventingConfiguration("invalid-params");
    },

    // `true` indicates a successful configuration update.
    mockResponse: true,
    actualResponse: true,
  },
] as const;
