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

import { resolveAuthParams } from "@adobe/aio-commerce-lib-auth";

import type {
  CommerceEventProvider,
  CommerceEventSubscription,
} from "@adobe/aio-commerce-lib-events/commerce";
import type {
  EventProviderType,
  IoEventMetadata,
  IoEventProvider,
  IoEventRegistration,
} from "@adobe/aio-commerce-lib-events/io-events";
import type { ApplicationMetadata } from "#config/index";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  AppEvent,
  CommerceEvent,
  EventProvider,
} from "#config/schema/eventing";
import type { EventsExecutionContext } from "./context";
import type { AppEventWithoutRuntimeActions } from "./types";

// The two different provider types we support.
export const COMMERCE_PROVIDER_TYPE = "dx_commerce_events";
export const EXTERNAL_PROVIDER_TYPE = "3rd_party_custom_events";

// Map each provider type to a human-readable label.
const PROVIDER_TYPE_TO_LABEL = {
  [COMMERCE_PROVIDER_TYPE]: "Commerce",
  [EXTERNAL_PROVIDER_TYPE]: "External",
} as const;

/** Config type when eventing is present. */
export type EventsConfig = CommerceAppConfigOutputModel & {
  eventing: NonNullable<CommerceAppConfigOutputModel["eventing"]>;
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
export function findExistingProvider<
  TProvider extends IoEventProvider | CommerceEventProvider,
>(allProviders: TProvider[], instanceId: string) {
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
<<<<<<< HEAD
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
 * Generates a namespaced event name by combining the application ID with the event name.
 * @param metadata
 * @param name
 */
export function getNamespacedEvent(
  metadata: ApplicationMetadata,
  name: string,
) {
  return `${metadata.id}.${name}`;
}

/**
 * Creates a fully qualified event name for Adobe Commerce events.
 * @param appId - The application ID
 * @param event - The Commerce event
 */
export function getEventName(appId: string, event: CommerceEvent) {
  return `${appId}.${event.name}`;
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
  events: AppEventWithoutRuntimeActions[],
  runtimeAction: string,
) {
  return [
    "This registration was automatically created by @adobe/aio-commerce-lib-app. ",
    `It belongs to the provider "${provider.label}" (instance ID: ${provider.instance_id}). `,
    `It routes ${events.length} event(s) to the runtime action "${runtimeAction}".`,
  ].join("\n");
}

/**
 * Groups events by their runtime actions. Since each event can have multiple
 * runtime actions, this function creates a mapping where each unique runtime
 * action points to all events that target it.
 *
 * @param events - The events to group by runtime actions.
 */
export function groupEventsByRuntimeActions(
  events: AppEvent[],
): Map<string, AppEvent[]> {
  const actionEventsMap = new Map<string, AppEvent[]>();

  for (const event of events) {
    for (const runtimeAction of event.runtimeActions) {
      const existingEvents = actionEventsMap.get(runtimeAction) ?? [];
      actionEventsMap.set(runtimeAction, [...existingEvents, event]);
    }
  }

  return actionEventsMap;
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

/*
 * Find an existing Commerce event subscription by its event name.
 * @param allSubscriptions - Map of all existing event subscriptions keyed by event name.
 * @param eventName - The namespaced event name to search for.
 */
export function findExistingSubscription(
  allSubscriptions: Map<string, CommerceEventSubscription>,
  eventName: string,
) {
  return allSubscriptions.get(eventName) ?? null;
}

/**
 * Creates a partially filled workspace configuration object based on the app credentials and parameters.
 * This configuration is used when creating an event provider in Commerce.
 *
 * @param context - The execution context containing app credentials and parameters.
 */
export function makeWorkspaceConfig(context: EventsExecutionContext) {
  const { appData, params } = context;
  const {
    consumerOrgId,
    orgName,
    projectId,
    projectName,
    projectTitle,
    workspaceId,
    workspaceName,
    workspaceTitle,
  } = appData;

  const authParams = resolveAuthParams(params);
  if (authParams.strategy !== "ims") {
    throw new Error(
      "Failed to resolve IMS authentication parameters from the runtime action inputs.",
    );
  }

  const {
    clientId,
    clientSecrets,
    technicalAccountEmail,
    technicalAccountId,
    imsOrgId,
    scopes,
  } = authParams;

  return {
    project: {
      id: projectId,
      name: projectName,
      title: projectTitle,

      org: {
        id: consumerOrgId,
        name: orgName,
        ims_org_id: imsOrgId,
      },

      workspace: {
        id: workspaceId,
        name: workspaceName,
        title: workspaceTitle,
        action_url: `https://${process.env.__OW_NAMESPACE}.adobeioruntime.net`,
        app_url: `https://${process.env.__OW_NAMESPACE}.adobeio-static.net`,
        details: {
          credentials: [
            {
              id: "000000",
              name: `aio-${workspaceId}`,
              integration_type: "oauth_server_to_server",
              oauth_server_to_server: {
                client_id: clientId,
                client_secrets: clientSecrets,
                technical_account_email: technicalAccountEmail,
                technical_account_id: technicalAccountId,
                scopes: scopes.map((scope) => scope.trim()),
              },
            },
          ],
        },
      },
    },
  };
}

/**
 * Retrieves the current existing data and returns it in a normalized way.
 * @param context The execution context.
 */
export async function getIoEventsExistingData(context: EventsExecutionContext) {
  // Ask for all the providers, and we'll create only those that are missing.
  const { ioEventsClient, appData } = context;
  const appCredentials = {
    consumerOrgId: appData.consumerOrgId,
    projectId: appData.projectId,
    workspaceId: appData.workspaceId,
  };

  const {
    _embedded: { providers: existingProviders },
  } = await ioEventsClient.getAllEventProviders({
    consumerOrgId: appData.consumerOrgId,
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

/** The I/O Events data that we may already have. */
export type ExistingIoEventsData = Awaited<
  ReturnType<typeof getIoEventsExistingData>
>;

/**
 * Retrieves the current existing Commerce eventing data and returns it in a normalized way.
 * @param context - The execution context.
 */
export async function getCommerceEventingExistingData(
  context: EventsExecutionContext,
) {
  const { commerceEventsClient } = context;

  const existingProviders = await commerceEventsClient.getAllEventProviders();
  const existingSubscriptions =
    await commerceEventsClient.getAllEventSubscriptions();

  // The eventing module workspace configuration is empty if the default provider
  // (the one without an ID), has a falsy or whitespace-only workspace_configuration.
  const isDefaultWorkspaceConfigurationEmpty = existingProviders.some(
    (provider) =>
      // biome-ignore lint/complexity/useSimplifiedLogicExpression: It's more readable this way
      !("id" in provider) && !provider.workspace_configuration?.trim(),
  );

  const subscriptions = new Map(
    existingSubscriptions.map((subscription) => [
      subscription.name,
      subscription,
    ]),
  );

  return {
    isDefaultWorkspaceConfigurationEmpty,
    providers: existingProviders,
    subscriptions,
  };
}

/** The Commerce Eventing data that we may already have. */
export type ExistingCommerceEventingData = Awaited<
  ReturnType<typeof getCommerceEventingExistingData>
>;
