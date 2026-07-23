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
import type { createCommerceEventsApiClient } from "#commerce/index";

type CommerceEventsApiClient = ReturnType<typeof createCommerceEventsApiClient>;

export const COMMERCE_EVENTS_API_PAYLOADS = [
  {
    hasInputValidation: false,

    invoke(client: CommerceEventsApiClient, fetchOptions?: Options) {
      return client.getAllEventProviders(fetchOptions);
    },
    method: "GET",
    name: "getAllEventProviders",
    pathname: "eventing/eventProvider",
  },
  {
    hasInputValidation: true,

    invoke(client: CommerceEventsApiClient, fetchOptions?: Options) {
      return client.getEventProviderById(
        {
          provider_id: "provider-1",
        },
        fetchOptions,
      );
    },
    method: "GET",
    name: "getEventProviderById",
    pathname: "eventing/eventProvider/provider-1",
  },
  {
    hasInputValidation: true,

    invoke(client: CommerceEventsApiClient, fetchOptions?: Options) {
      return client.createEventProvider(
        {
          description: "Provider 1 description",
          instance_id: "instance-1",
          label: "Provider 1",
          provider_id: "provider-1",
          workspace_configuration: {},
        },
        fetchOptions,
      );
    },
    method: "POST",
    name: "createEventProvider",
    pathname: "eventing/eventProvider",
  },
  {
    hasInputValidation: false,

    invoke(client: CommerceEventsApiClient, fetchOptions?: Options) {
      return client.getAllEventSubscriptions(fetchOptions);
    },
    method: "GET",
    name: "getAllEventSubscriptions",
    pathname: "eventing/getEventSubscriptions",
  },
  {
    hasInputValidation: true,

    invoke(client: CommerceEventsApiClient, fetchOptions?: Options) {
      return client.createEventSubscription(
        {
          fields: [{ name: "field-1" }],
          name: "subscription-1",
          provider_id: "provider-1",
        },
        fetchOptions,
      );
    },
    method: "POST",
    name: "createEventSubscription",
    pathname: "eventing/eventSubscribe",
  },
  {
    hasInputValidation: true,

    invoke(client: CommerceEventsApiClient, fetchOptions?: Options) {
      return client.updateEventingConfiguration(
        {
          enabled: true,
        },
        fetchOptions,
      );
    },
    method: "PUT",
    name: "updateEventingConfiguration",
    pathname: "eventing/updateConfiguration",
  },
] as const;
