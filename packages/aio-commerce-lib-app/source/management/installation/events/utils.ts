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
import { createCommerceEventsApiClient } from "@adobe/aio-commerce-lib-events/commerce";
import { createAdobeIoEventsApiClient } from "@adobe/aio-commerce-lib-events/io-events";

import type { CommerceEventsApiClient } from "@adobe/aio-commerce-lib-events/commerce";
import type {
  AdobeIoEventsApiClient,
  IoEventMetadata,
  IoEventProvider,
} from "@adobe/aio-commerce-lib-events/io-events";
import type { ApplicationMetadata } from "#config/index";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { EventProvider } from "#config/schema/eventing";
import type {
  ExecutionContext,
  InstallationContext,
  StepContextFactory,
} from "#management/installation/workflow/step";

export const COMMERCE_PROVIDER_TYPE = "dx_commerce_events";
export const EXTERNAL_PROVIDER_TYPE = "3rd_party_custom_events";

/** Config type when eventing is present. */
export type EventsConfig = CommerceAppConfigOutputModel & {
  eventing: NonNullable<CommerceAppConfigOutputModel["eventing"]>;
};

/** Context available to event steps (inherited from eventing branch). */
export interface EventsStepContext extends Record<string, unknown> {
  get ioEventsClient(): AdobeIoEventsApiClient;
  get commerceEventsClient(): CommerceEventsApiClient;
}

/** The execution context for event leaf steps. */
export type EventsExecutionContext = ExecutionContext<EventsStepContext>;

/** Creates the events step context with lazy-initialized API clients. */
export const createEventsStepContext: StepContextFactory<EventsStepContext> = (
  installation: InstallationContext,
) => {
  const { params } = installation;
  let ioEventsClient: AdobeIoEventsApiClient | null = null;
  let commerceEventsClient: CommerceEventsApiClient | null = null;

  return {
    get ioEventsClient() {
      if (ioEventsClient === null) {
        const ioEventsClientParams = resolveIoEventsHttpClientParams(params);
        ioEventsClient = createAdobeIoEventsApiClient(ioEventsClientParams);
      }

      return ioEventsClient;
    },

    get commerceEventsClient() {
      if (commerceEventsClient === null) {
        const commerceClientParams = resolveCommerceHttpClientParams(params);
        commerceEventsClient =
          createCommerceEventsApiClient(commerceClientParams);
      }

      return commerceEventsClient;
    },
  };
};

/**
 * Generates a unique instance ID for the given event provider within the context of the provided config.
 * @param config - The commerce app configuration
 * @param provider - The event provider for which to generate the instance ID
 */
export function generateInstanceId(
  metadata: ApplicationMetadata,
  provider: EventProvider,
) {
  const slugLabel = provider.label.toLowerCase().replace(/\s+/g, "-");
  return `${metadata.id}-${provider.key ?? slugLabel}`;
}

/**
 * Find an existing event provider by its instance ID.
 * @param allProviders - The list of all existing event providers.
 * @param instanceId - The instance ID to search for.
 */
export function findExistingProvider(
  allProviders: IoEventProvider[],
  instanceId: string,
) {
  return (
    allProviders.find((provider) => provider.instance_id === instanceId) ?? null
  );
}

/**
 * Find existing event metadata by its event name.
 * @param allMetadata - The list of all existing event metadata.
 * @param eventName - The event name to search for.
 */
export function findExistingProviderMetadata(
  allMetadata: IoEventMetadata[],
  eventName: string,
) {
  return allMetadata.find((meta) => meta.event_code === eventName) ?? null;
}

/**
 * Retrieves the current existing data and returns it in a normalized way.
 * @param context The execution context.
 */
export async function getIoEventsExistingData(context: EventsExecutionContext) {
  // Ask for all the providers, and we'll create only those that are missing.
  const { ioEventsClient, appCredentials } = context;
  const {
    _embedded: { providers: existingProviders },
  } = await ioEventsClient.getAllEventProviders({
    consumerOrgId: appCredentials.consumerOrgId,
    withEventMetadata: true,
  });

  // Collect all the metadata from the providers HAL model for easier data access.
  const providersWithMetadata = existingProviders.map((providerHal) => {
    const { _embedded, _links, ...providerData } = providerHal;

    const metadataHal = _embedded?.eventmetadata ?? [];
    const actualMetadata = metadataHal.map(
      ({ _embedded, _links, ...meta }) => ({
        ...meta,
        sample: _embedded?.sample_event ?? null,
      }),
    );

    return {
      ...providerData,
      metadata: actualMetadata,
    };
  });

  return {
    providersWithMetadata,
  };
}

/** The data that we may already have in I/O Events. */
export type ExistingIoEventsData = Awaited<
  ReturnType<typeof getIoEventsExistingData>
>;
