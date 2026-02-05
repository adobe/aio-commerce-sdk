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
import {
  nonEmptyStringValueSchema,
  parseOrThrow,
} from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

import type { CommerceEventsApiClient } from "@adobe/aio-commerce-lib-events/commerce";
import type {
  AdobeIoEventsApiClient,
  EventProviderType,
  IoEventMetadata,
  IoEventProvider,
  IoEventRegistration,
} from "@adobe/aio-commerce-lib-events/io-events";
import type { ApplicationMetadata } from "#config/index";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { EventProvider } from "#config/schema/eventing";
import type {
  ExecutionContext,
  InstallationContext,
  StepContextFactory,
} from "#management/installation/workflow/step";
import type { AppEventWithoutRuntimeAction } from "./types";

// The two different provider types we support.
export const COMMERCE_PROVIDER_TYPE = "dx_commerce_events";
export const EXTERNAL_PROVIDER_TYPE = "3rd_party_custom_events";

// Map each provider type to a human-readable label.
const PROVIDER_TYPE_TO_LABEL = {
  [COMMERCE_PROVIDER_TYPE]: "Commerce",
  [EXTERNAL_PROVIDER_TYPE]: "External",
} as const;

const CONSUMER_ORG_ID_LENGTH = 6;
const PROJECT_ID_LENGTH = 19;
const WORKSPACE_ID_LENGTH = 19;

const AppCredentialsSchema = v.object({
  clientId: nonEmptyStringValueSchema("clientId"),
  consumerOrgId: v.pipe(
    nonEmptyStringValueSchema("consumerOrgId"),
    v.length(
      CONSUMER_ORG_ID_LENGTH,
      `consumerOrgId must be ${CONSUMER_ORG_ID_LENGTH} characters long`,
    ),
  ),

  projectId: v.pipe(
    nonEmptyStringValueSchema("projectId"),
    v.length(
      PROJECT_ID_LENGTH,
      `projectId must be ${PROJECT_ID_LENGTH} characters long`,
    ),
  ),

  workspaceId: v.pipe(
    nonEmptyStringValueSchema("workspaceId"),
    v.length(
      WORKSPACE_ID_LENGTH,
      `workspaceId must be ${WORKSPACE_ID_LENGTH} characters long`,
    ),
  ),
});

/** Config type when eventing is present. */
export type EventsConfig = CommerceAppConfigOutputModel & {
  eventing: NonNullable<CommerceAppConfigOutputModel["eventing"]>;
};

/** Context available to event steps (inherited from eventing branch). */
export interface EventsStepContext extends Record<string, unknown> {
  get appCredentials(): {
    clientId: string;
    consumerOrgId: string;
    projectId: string;
    workspaceId: string;
  };

  get commerceEventsClient(): CommerceEventsApiClient;
  get ioEventsClient(): AdobeIoEventsApiClient;
}

/** The execution context for event leaf steps. */
export type EventsExecutionContext = ExecutionContext<EventsStepContext>;

/** Creates the events step context with lazy-initialized API clients. */
export const createEventsStepContext: StepContextFactory<EventsStepContext> = (
  installation: InstallationContext,
) => {
  const { params } = installation;

  let commerceEventsClient: CommerceEventsApiClient | null = null;
  let ioEventsClient: AdobeIoEventsApiClient | null = null;

  const appCredentials = parseOrThrow(AppCredentialsSchema, {
    clientId: params.clientId,
    consumerOrgId: params.consumerOrgId,
    projectId: params.projectId,
    workspaceId: params.workspaceId,
  });

  return {
    get commerceEventsClient() {
      if (commerceEventsClient === null) {
        const commerceClientParams = resolveCommerceHttpClientParams(params);
        commerceClientParams.fetchOptions ??= {};
        commerceClientParams.fetchOptions.timeout = 1000 * 60 * 2; // 2 minutes

        commerceEventsClient =
          createCommerceEventsApiClient(commerceClientParams);
      }

      return commerceEventsClient;
    },

    get ioEventsClient() {
      if (ioEventsClient === null) {
        const ioEventsClientParams = resolveIoEventsHttpClientParams(params);
        ioEventsClientParams.fetchOptions ??= {};
        ioEventsClientParams.fetchOptions.timeout = 1000 * 60 * 2; // 2 minutes

        ioEventsClient = createAdobeIoEventsApiClient(ioEventsClientParams);
      }

      return ioEventsClient;
    },

    get appCredentials() {
      return appCredentials;
    },
  };
};

/**
 * Generates a unique instance ID for the given event provider within the context of the provided config.
 * @param metadata - The metadata of the application
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
 * Find existing event registrations by client ID and name.
 * @param allRegistrations - The list of all existing event registrations.
 * @param clientId - The client ID of the workspace where the registration was created.
 * @param name - The name of the registration to search for.
 */
export function findExistingRegistrations(
  allRegistrations: IoEventRegistration[],
  clientId: string,
  name: string,
) {
  // We don't have an ID to search for, but names are deterministic and calculated by us so it should be fine.
  // To be safe, the `allRegistrations` should come from the current installation data.
  return allRegistrations.find(
    (reg) => reg.client_id === clientId && reg.name === name,
  );
}

/**
 * Get the fully qualified name of an event for I/O Events based on the provider type.
 * @param name - The name of the event.
 * @param providerType - The type of the event provider.
 */
export function getIoEventCode(name: string, providerType: EventProviderType) {
  return providerType === COMMERCE_PROVIDER_TYPE
    ? `com.adobe.commerce.${name}`
    : name;
}

/**
 * Generates a registration name and description based on the provider, events, and runtime action.
 * @param provider - The provider this registration is associated to.
 * @param runtimeAction - The runtime action this registration points to.
 */
export function getRegistrationName(
  provider: IoEventProvider,
  runtimeAction: string,
) {
  const providerType = provider.provider_metadata as EventProviderType;
  const providerLabel = PROVIDER_TYPE_TO_LABEL[providerType] ?? "Unknown";

  // As per the schema, runtimeAction is always in the format "package-name/action-name".
  const [packageName, actionName] = runtimeAction
    .split("/")
    .map(kebabToTitleCase);

  return `${providerLabel} Event Registration: ${actionName} (${packageName})`;
}

/**
 * Generates a registration name and description based on the provider, events, and runtime action.
 * @param provider - The provider this registration is associated to.
 * @param events - The events routed by this registration.
 * @param runtimeAction - The runtime action this registration points to.
 */
export function getRegistrationDescription(
  provider: IoEventProvider,
  events: AppEventWithoutRuntimeAction[],
  runtimeAction: string,
) {
  return [
    "This registration was automatically created by `@adobe/aio-commerce-lib-app`.",
    `It belongs to the provider ${provider.label} with instance ID: ${provider.instance_id}.`,
    `It routes the following ${events.length} event(s) to the runtime action "${runtimeAction}:\n".`,
    ...events.map((event) => `- ${event.name}`),
  ].join("\n");
}

/**
 * Converts a kebab-case string to Title Case.
 * @param str - The kebab-case string to convert.
 */
export function kebabToTitleCase(str: string) {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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

  const {
    _embedded: { registrations: registrationsHal },
  } = await ioEventsClient.getAllRegistrations(appCredentials);

  const registrations = registrationsHal.map(({ _links, ...reg }) => reg);
  return {
    providersWithMetadata,
    registrations,
  };
}

/** The data that we may already have in I/O Events. */
export type ExistingIoEventsData = Awaited<
  ReturnType<typeof getIoEventsExistingData>
>;
