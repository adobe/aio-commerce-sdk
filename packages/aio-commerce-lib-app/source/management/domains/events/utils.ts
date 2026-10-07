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
import {
  getSystemConfigByKey,
  setSystemConfigByKey,
} from "@adobe/aio-commerce-lib-config";

import { appliesToEnv } from "#config/lib/environment";

import type { CommerceEnv } from "@adobe/aio-commerce-lib-core/commerce";
import type { UpdateEventingConfigurationParams } from "@adobe/aio-commerce-lib-events/commerce";
import type {
  EventProviderType,
  IoEventProvider,
} from "@adobe/aio-commerce-lib-events/io-events";
import type { ApplicationMetadata } from "#config/index";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { AppEvent, EventProvider } from "#config/schema/eventing";
import type { EventsExecutionContext } from "./context";
import type {
  AppEventWithoutRuntimeActions,
  EventingProviderSnapshot,
  StoredEventsData,
} from "./types";

// The two different provider types we support.
export const COMMERCE_PROVIDER_TYPE = "dx_commerce_events";
export const EXTERNAL_PROVIDER_TYPE = "3rd_party_custom_events";

// Map each provider type to a human-readable label.
const PROVIDER_TYPE_TO_LABEL = {
  [COMMERCE_PROVIDER_TYPE]: "Commerce",
  [EXTERNAL_PROVIDER_TYPE]: "External",
} as const;

/** Max characters taken from `metadata.id` in the I/O Events provider `instance_id`. */
const METADATA_ID_MAX_LENGTH_FOR_INSTANCE_ID = 100;

/** Storage key used for the events installation data in system config. */
export const EVENTS_STORAGE_KEY = "events";

/**
 * Adds the given providers to the stored events data, replacing stored entries with the same key.
 * @param providers - The stored data of each provider, by provider key.
 */
export async function storeEventProviders(
  providers: StoredEventsData["providers"],
): Promise<void> {
  if (Object.keys(providers).length === 0) {
    return;
  }

  const existing =
    await getSystemConfigByKey<StoredEventsData>(EVENTS_STORAGE_KEY);

  await setSystemConfigByKey(EVENTS_STORAGE_KEY, {
    providers: { ...existing?.providers, ...providers },
  });
}

/**
 * Prunes the given providers from the stored events data.
 * @param providerKeys - The keys of the providers to prune.
 */
export async function pruneStoredEventProviders(
  providerKeys: string[],
): Promise<void> {
  if (providerKeys.length === 0) {
    return;
  }

  const existing =
    await getSystemConfigByKey<StoredEventsData>(EVENTS_STORAGE_KEY);
  if (!existing) {
    return;
  }

  const providerKeysToRemove = new Set(providerKeys);
  const hasStoredProvider = providerKeys.some((key) =>
    Object.hasOwn(existing.providers, key),
  );

  if (!hasStoredProvider) {
    return;
  }

  const providers = Object.fromEntries(
    Object.entries(existing.providers).filter(
      ([key]) => !providerKeysToRemove.has(key),
    ),
  );

  if (Object.keys(providers).length === 0) {
    await setSystemConfigByKey(EVENTS_STORAGE_KEY, null);
    return;
  }

  await setSystemConfigByKey(EVENTS_STORAGE_KEY, { providers });
}

/**
 * Generates a unique instance ID for I/O Events for this app deployment.
 * Uses `{metadata.id (first 100 chars)}-{providerKeyOrSlug}-{workspaceId}` (lowercased).
 *
 * @param metadata - The metadata of the application
 * @param provider - The event provider (optional `key`, else label is slugified)
 * @param workspaceId - Adobe I/O Developer Console workspace ID for this deployment
 */
export function generateInstanceId(
  metadata: Pick<ApplicationMetadata, "id">,
  provider: EventProvider,
  workspaceId: string,
) {
  const appId = metadata.id.slice(0, METADATA_ID_MAX_LENGTH_FOR_INSTANCE_ID);
  const providerKey =
    provider.key ?? provider.label.toLowerCase().replace(/\s+/g, "-");
  return `${appId}-${providerKey}-${workspaceId}`.toLowerCase();
}

/**
 * Old version of instanceId generator which can be not unique within the same ORG.
 *
 * @param metadata - The metadata of the application
 * @param provider - The event provider for which to generate the instance ID
 * @deprecated use {@link generateInstanceId} instead
 */
export function generateInstanceIdDeprecated(
  metadata: Pick<ApplicationMetadata, "id">,
  provider: EventProvider,
) {
  const slugLabel = provider.label.toLowerCase().replace(/\s+/g, "-");
  return `${metadata.id}-${provider.key ?? slugLabel}`.toLowerCase();
}

/**
 * Whether an I/O provider `instance_id` has this app's current format for this workspace: it starts
 * with the truncated, lowercased app id and ends with the workspace id. Legacy workspace-less ids
 * (see {@link generateInstanceIdDeprecated}) never match.
 *
 * @param instanceId - The I/O provider instance id.
 * @param appId - The app's `metadata.id`.
 * @param workspaceId - The workspace the app is deployed to.
 */
export function isIoProviderProvenOwnedByApp(
  instanceId: string,
  appId: string,
  workspaceId: string,
): boolean {
  const id = instanceId.toLowerCase();
  return (
    id.startsWith(`${instanceIdPrefix(appId)}-`) &&
    id.endsWith(`-${workspaceId.toLowerCase()}`)
  );
}

/**
 * Extracts the provider key from an instance id generated by {@link generateInstanceId}.
 *
 * @param instanceId - An instance id for which {@link isIoProviderProvenOwnedByApp} holds.
 * @param appId - The app's `metadata.id`.
 * @param workspaceId - The workspace the app is deployed to.
 */
export function getProviderKeyFromInstanceId(
  instanceId: string,
  appId: string,
  workspaceId: string,
): string {
  const start = instanceIdPrefix(appId).length + 1;
  const end = instanceId.length - workspaceId.length - 1;
  return instanceId.toLowerCase().slice(start, end);
}

/** The app id part of an instance id. */
function instanceIdPrefix(appId: string): string {
  return appId.slice(0, METADATA_ID_MAX_LENGTH_FOR_INSTANCE_ID).toLowerCase();
}

/**
 * The env-scoped providers a config declares for one event kind. Providers with no event for
 * the environment are left out.
 *
 * @param config - The app config, or `null` when there is none.
 * @param type - The provider type, which selects Commerce or external events.
 * @param env - The Commerce environment the app is installed in.
 */
export function getProviderSnapshots(
  config: CommerceAppConfigOutputModel | null,
  type: EventProviderType,
  env: CommerceEnv,
): EventingProviderSnapshot[] {
  const sources =
    type === COMMERCE_PROVIDER_TYPE
      ? config?.eventing?.commerce
      : config?.eventing?.external;

  return (sources ?? []).flatMap(({ provider, events }) => {
    const applicable = events.filter((event) => appliesToEnv(event, env));

    if (applicable.length === 0) {
      return [];
    }

    return [
      { events: applicable, key: getProviderKey(provider), provider, type },
    ];
  });
}

/**
 * Returns a provider's version-stable identity, used to match a provider across config
 * versions during an upgrade diff. Prefers the explicit `key`; falls back to the `label`,
 * which the eventing schema requires to be unique across event sources.
 *
 * @param provider - The event provider to identify.
 */
export function getProviderKey(provider: EventProvider) {
  return provider.key ?? provider.label;
}

/**
 * Generates a namespaced event name by combining the application ID with the event name.
 *
 * The application ID is sanitized to comply with the Commerce Eventing API's event code
 * format requirement (`[a-zA-Z0-9_.]`): any character outside that set is replaced with `_`.
 *
 * @param metadata
 * @param name
 */
export function getNamespacedEvent(
  metadata: Pick<ApplicationMetadata, "id">,
  name: string,
) {
  const sanitizedId = metadata.id.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  return `${sanitizedId}.${name}`.toLowerCase();
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
 * The fully-qualified I/O Events code for an event under a provider type: the event name is
 * namespaced with the application id and then qualified by {@link getIoEventCode}.
 *
 * @param event - The event to compute the code for.
 * @param metadata - The application metadata used to namespace the event name.
 * @param providerType - The type of the event provider.
 */
export function eventCodeOf(
  event: AppEvent,
  metadata: Pick<ApplicationMetadata, "id">,
  providerType: EventProviderType,
) {
  return getIoEventCode(getNamespacedEvent(metadata, event.name), providerType);
}

/** Maps a provider's metadata type to its human-readable label ("Commerce" or "External"). */
function getProviderTypeLabel(
  provider: Pick<IoEventProvider, "provider_metadata">,
) {
  return PROVIDER_TYPE_TO_LABEL[
    provider.provider_metadata as EventProviderType
  ];
}

/**
 * Generates a registration name based on the provider type, provider label, and runtime action.
 *
 * Prefixes with the provider type label ("Commerce" or "External") for readability, then the
 * provider's own label to ensure uniqueness when multiple providers of the same type route
 * events to the same runtime action.
 *
 * @param provider - The provider this registration is associated to.
 * @param runtimeAction - The runtime action this registration points to.
 */
export function getRegistrationName(
  provider: Pick<IoEventProvider, "label" | "provider_metadata">,
  runtimeAction: string,
) {
  const [packageName, actionName] = runtimeAction
    .split("/")
    .map(kebabToTitleCase);

  return `${getProviderTypeLabel(provider)} Event Registration: ${provider.label} - ${actionName} (${packageName})`;
}

/**
 * Returns the registration name in the legacy format used by SDK versions that built
 * the name from the generic provider type label ("Commerce" / "External") rather than
 * the provider's own label. Used during uninstall to match registrations that were
 * created before the naming change.
 *
 * @param provider - The provider this registration is associated to.
 * @param runtimeAction - The runtime action this registration points to.
 * @deprecated Use {@link getRegistrationName} for all new registrations.
 */
export function getLegacyRegistrationName(
  provider: IoEventProvider,
  runtimeAction: string,
) {
  const [packageName, actionName] = runtimeAction
    .split("/")
    .map(kebabToTitleCase);

  return `${getProviderTypeLabel(provider)} Event Registration: ${actionName} (${packageName})`;
}

/**
 * Generates a registration name and description based on the provider, events, and runtime action.
 * @param provider - The provider this registration is associated to.
 * @param events - The events routed by this registration.
 * @param runtimeAction - The runtime action this registration points to.
 */
export function getRegistrationDescription(
  provider: Pick<IoEventProvider, "label" | "instance_id">,
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
 * Builds the payload to send to Commerce when configuring Eventing.
 * Returns `null` when no update call is needed.
 *
 * @param initialParams - Initial Commerce Eventing configuration parameters.
 * @param existingData - Existing Commerce Eventing state from the API.
 */
export function getCommerceEventingConfigurationUpdateParams(
  initialParams: UpdateEventingConfigurationParams,
  existingData: Pick<
    ExistingCommerceEventingData,
    "isDefaultProviderConfigured" | "isDefaultWorkspaceConfigurationEmpty"
  >,
) {
  const { isDefaultProviderConfigured, isDefaultWorkspaceConfigurationEmpty } =
    existingData;

  if (isDefaultProviderConfigured && !isDefaultWorkspaceConfigurationEmpty) {
    return null;
  }

  const { workspace_configuration, ...configWithoutWorkspace } = initialParams;
  let updateParams: UpdateEventingConfigurationParams = { enabled: true };

  if (isDefaultWorkspaceConfigurationEmpty) {
    if (!workspace_configuration) {
      const message =
        "Workspace configuration is required to enable Commerce Eventing when there is not an existing one.";

      throw new Error(message);
    }

    updateParams.workspace_configuration = workspace_configuration;
  }

  if (!isDefaultProviderConfigured) {
    updateParams = {
      ...updateParams,
      ...configWithoutWorkspace,
    };
  }

  return updateParams;
}

/**
 * Sanitizes a Commerce Eventing identifier.
 * Preserves underscores, converts spaces to underscores, lowercases, and strips the rest.
 *
 * @param value - The raw identifier value to normalize.
 */
export function sanitizeEventingIdentifier(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
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

  // Commerce's OAuth config factory requires these fields even though this credential
  // type doesn't otherwise need them, so default them when absent.
  const defaultTechnicalAccount = `${process.env.__OW_NAMESPACE}@techacct.adobe.com`;

  return {
    project: {
      id: projectId,
      name: projectName,

      org: {
        id: consumerOrgId,
        ims_org_id: imsOrgId,
        name: orgName,
      },
      title: projectTitle,

      workspace: {
        action_url: `https://${process.env.__OW_NAMESPACE}.adobeioruntime.net`,
        app_url: `https://${process.env.__OW_NAMESPACE}.adobeio-static.net`,
        details: {
          credentials: [
            {
              id: "000000",
              integration_type: "oauth_server_to_server",
              name: `aio-${workspaceId}`,
              oauth_server_to_server: {
                client_id: clientId,
                client_secrets: clientSecrets,
                scopes: scopes.map((scope) => scope.trim()),
                technical_account_email:
                  technicalAccountEmail ?? defaultTechnicalAccount,
                technical_account_id:
                  technicalAccountId ?? defaultTechnicalAccount,
              },
            },
          ],
        },
        id: workspaceId,
        name: workspaceName,
        title: workspaceTitle,
      },
    },
  };
}

/**
 * Retrieves the current existing data and returns it in a normalized way.
 * @param context The execution context.
 */
export async function getIoEventsExistingData(
  context: Pick<EventsExecutionContext, "appData" | "ioEventsClient">,
) {
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
      ({ _embedded: metadataEmbedded, _links: _metadataLinks, ...meta }) => ({
        ...meta,
        sample: metadataEmbedded?.sample_event ?? null,
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

/** A single I/O Events provider with its event metadata, as returned by {@link getIoEventsExistingData}. */
export type IoEventProviderWithMetadata =
  ExistingIoEventsData["providersWithMetadata"][number];

/**
 * Retrieves the current existing Commerce eventing data and returns it in a normalized way.
 * @param context - The execution context.
 */
export async function getCommerceEventingExistingData(
  context: Pick<EventsExecutionContext, "commerceEventsClient">,
) {
  const { commerceEventsClient } = context;

  const existingProviders = await commerceEventsClient.getAllEventProviders();
  const existingSubscriptions =
    await commerceEventsClient.getAllEventSubscriptions();

  const defaultProvider =
    existingProviders.find((provider) => !("id" in provider)) ?? null;

  // The eventing module workspace configuration is empty if the default provider
  // (the one without an ID), has a falsy or whitespace-only workspace_configuration.
  const isDefaultProviderConfigured = defaultProvider !== null;
  const isDefaultWorkspaceConfigurationEmpty = isDefaultProviderConfigured
    ? !defaultProvider.workspace_configuration?.trim()
    : true;

  const subscriptions = new Map(
    existingSubscriptions.map((subscription) => [
      subscription.name,
      subscription,
    ]),
  );

  return {
    isDefaultProviderConfigured,
    isDefaultWorkspaceConfigurationEmpty,
    providers: existingProviders,
    subscriptions,
  };
}

/** The Commerce Eventing data that we may already have. */
export type ExistingCommerceEventingData = Awaited<
  ReturnType<typeof getCommerceEventingExistingData>
>;
