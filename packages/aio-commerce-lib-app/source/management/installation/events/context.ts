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

import {
  resolveCommerceHttpClientParams,
  resolveIoEventsHttpClientParams,
} from "@adobe/aio-commerce-lib-api";
import {
  createCustomCommerceEventsApiClient,
  createEventProvider as createEventProviderCommerce,
  createEventSubscription,
  getAllEventProviders as getAllEventProvidersCommerce,
  getAllEventSubscriptions,
  updateEventingConfiguration,
} from "@adobe/aio-commerce-lib-events/commerce";
import {
  createCustomAdobeIoEventsApiClient,
  createEventMetadataForProvider,
  createEventProvider,
  createRegistration,
  getAllEventProviders,
  getAllRegistrations,
} from "@adobe/aio-commerce-lib-events/io-events";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type {
  ExecutionContext,
  InstallationContext,
} from "#management/installation/workflow/index";

/**
 * Create a custom Commerce API Client with only the operations we need for optimal package size.
 * @param params - The runtime action params to resolve the client params from.
 */
function createCommerceEventsApiClient(params: RuntimeActionParams) {
  const commerceClientParams = resolveCommerceHttpClientParams(params, {
    tryForwardAuthProvider: true,
  });

  commerceClientParams.fetchOptions ??= {};
  commerceClientParams.fetchOptions.timeout = 1000 * 60 * 2; // 2 minutes

  return createCustomCommerceEventsApiClient(commerceClientParams, {
    createEventProvider: createEventProviderCommerce,
    getAllEventProviders: getAllEventProvidersCommerce,
    createEventSubscription,
    getAllEventSubscriptions,
    updateEventingConfiguration,
  });
}

/** A commerce eventing API client with only the operations used to install events.  */
export type CustomCommerceEventsApiClient = ReturnType<
  typeof createCommerceEventsApiClient
>;

/**
 * Create a custom Adobe I/O Events API Client with only the operations we need for optimal package size.
 * @param params - The runtime action params to resolve the client params from.
 */
function createIoEventsApiClient(params: RuntimeActionParams) {
  const ioEventsClientParams = resolveIoEventsHttpClientParams(params);
  ioEventsClientParams.fetchOptions ??= {};
  ioEventsClientParams.fetchOptions.timeout = 1000 * 60 * 2; // 2 minutes

  return createCustomAdobeIoEventsApiClient(ioEventsClientParams, {
    createEventProvider,
    createEventMetadataForProvider,
    createRegistration,
    getAllEventProviders,
    getAllRegistrations,
  });
}

/** An Adobe I/O Events API client with only the operations used to install events.  */
export type CustomAdobeIoEventsApiClient = ReturnType<
  typeof createIoEventsApiClient
>;

/** Creates the events step context with lazy-initialized API clients. */
export function createEventsStepContext(installation: InstallationContext) {
  const { params } = installation;

  let commerceEventsClient: CustomCommerceEventsApiClient | null = null;
  let ioEventsClient: CustomAdobeIoEventsApiClient | null = null;

  return {
    get commerceEventsClient() {
      if (commerceEventsClient === null) {
        commerceEventsClient = createCommerceEventsApiClient(params);
      }

      return commerceEventsClient;
    },

    get ioEventsClient() {
      if (ioEventsClient === null) {
        ioEventsClient = createIoEventsApiClient(params);
      }

      return ioEventsClient;
    },
  };
}

/** Context available to event steps (inherited from eventing branch). */
export type EventsStepContext = ReturnType<typeof createEventsStepContext>;

/** The execution context for event leaf steps. */
export type EventsExecutionContext = ExecutionContext<EventsStepContext>;
