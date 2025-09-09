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

import type { Options } from "@aio-commerce-sdk/aio-commerce-lib-api/ky";
import type { createCommerceEventsApiClient } from "#commerce/index";

type CommerceEventsApiClient = ReturnType<typeof createCommerceEventsApiClient>;

export const COMMERCE_EVENTS_API_PAYLOADS = [
  {
    name: "getAllEventProviders",
    method: "GET",
    pathname: "eventing/eventProvider",

    invoke(client: CommerceEventsApiClient, fetchOptions?: Options) {
      return client.getAllEventProviders(fetchOptions);
    },

    hasInputValidation: false,
    hasCamelCaseTransformer: true,
  },
  {
    name: "getEventProviderById",
    method: "GET",
    pathname: "eventing/eventProvider/provider-1",

    invoke(client: CommerceEventsApiClient, fetchOptions?: Options) {
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
    pathname: "eventing/eventProvider",

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

    hasInputValidation: true,
    hasCamelCaseTransformer: true,
  },
  {
    name: "getAllEventSubscriptions",
    method: "GET",
    pathname: "eventing/getEventSubscriptions",

    invoke(client: CommerceEventsApiClient, fetchOptions?: Options) {
      return client.getAllEventSubscriptions(fetchOptions);
    },

    hasInputValidation: false,
    hasCamelCaseTransformer: true,
  },
  {
    name: "createEventSubscription",
    method: "POST",
    pathname: "eventing/eventSubscribe",

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

    hasInputValidation: true,
    hasCamelCaseTransformer: false,
  },
  {
    name: "updateEventingConfiguration",
    method: "PUT",
    pathname: "eventing/updateConfiguration",

    invoke(client: CommerceEventsApiClient, fetchOptions?: Options) {
      return client.updateEventingConfiguration(
        {
          enabled: true,
        },
        fetchOptions,
      );
    },

    hasInputValidation: true,
    hasCamelCaseTransformer: false,
  },
] as const;
