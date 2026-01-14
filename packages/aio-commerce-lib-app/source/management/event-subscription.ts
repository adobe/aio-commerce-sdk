import {
  getImsAuthProvider,
  getIntegrationAuthProvider,
  resolveAuthParams,
} from "@adobe/aio-commerce-lib-auth";
import { createCommerceEventsApiClient } from "@adobe/aio-commerce-lib-events/commerce";

import { validateCommerceAppConfigDomain } from "~/config";

import type {
  ImsAuthParams,
  IntegrationAuthParams,
} from "@adobe/aio-commerce-lib-auth";
import type { CommerceEventProvider } from "@adobe/aio-commerce-lib-events/commerce";
import type { CamelCasedPropertiesDeep } from "type-fest";
import type { CommerceAppConfigOutputModel } from "~/config/schema/app";

function getCommerceEventsClient(
  authProvider:
    | (ImsAuthParams & { strategy: "ims" })
    | (IntegrationAuthParams & {
        strategy: "integration";
      }),
  baseUrl: string,
) {
  if (authProvider.strategy === "ims") {
    return createCommerceEventsApiClient({
      config: {
        baseUrl,
        flavor: "saas",
      },
      auth: getImsAuthProvider(authProvider),
    });
  }

  if (authProvider.strategy === "integration") {
    return createCommerceEventsApiClient({
      config: {
        baseUrl,
        flavor: "paas",
      },
      auth: getIntegrationAuthProvider(authProvider),
    });
  }

  throw new Error("Invalid auth provider strategy");
}

export function installCommerceEvents(
  appConfig: CommerceAppConfigOutputModel,
  params: Record<string, unknown> & { AIO_COMMERCE_API_BASE_URL: string },
  registeredCommerceProviders: Map<
    string,
    CommerceEventProvider | CamelCasedPropertiesDeep<CommerceEventProvider>
  >,
) {
  if (!appConfig.eventing?.commerce) {
    console.log(
      "No commerce eventing configuration found. Skipping event registration installation.",
    );
    return;
  }

  // validate the input against the CommerceProviderConfigSchema[] (?)
  validateCommerceAppConfigDomain(
    appConfig.eventing.commerce,
    "eventing.commerce",
  );

  // get baseUrl from ENV params
  const baseUrl = params.AIO_COMMERCE_API_BASE_URL;
  const authProvider = resolveAuthParams(params);

  const commerceEventsClient = getCommerceEventsClient(authProvider, baseUrl);

  if (!commerceEventsClient) {
    console.error("No valid commerce client could be created.");
    return;
  }

  const createSubscriptionPromises: Promise<void>[] = [];

  for (const { provider, events } of appConfig.eventing.commerce) {
    const instanceId = generateInstanceId(
      appConfig.metadata.id,
      provider.key ?? provider.label,
    );

    if (!registeredCommerceProviders.has(instanceId)) {
      console.warn(
        `Commerce event provider with key "${instanceId}" is not registered. Skipping its event subscriptions.`,
      );
      continue;
    }

    for (const event of events) {
      const { name, fields } = event;
      const namespacedEventName = createEventName(name, instanceId);
      const eventSpec = {
        name: namespacedEventName,
        parent: name,
        fields: allOrFields(fields),
        providerId: instanceId,
      };

      console.log(
        `Creating event subscription for event: ${namespacedEventName}:${name}`,
      );

      createSubscriptionPromises.push(
        commerceEventsClient.createEventSubscription(eventSpec),
      );
    }
  }

  return Promise.all(createSubscriptionPromises);
}

/**
 * Converts a list of field names or "*" into the appropriate format for event subscriptions.
 * @param fields
 */
export function allOrFields(fields: string[] | "*") {
  if (!Array.isArray(fields) && fields === "*") {
    return [{ name: "*" }];
  }

  return fields.map((name) => ({ name }));
}

/**
 * Creates a fully qualified event name for Adobe Commerce events.
 * @param eventName - The base event name
 * @param instanceId - The instance ID of the event provider
 */
export function createEventName(eventName: string, instanceId?: string) {
  if (eventName.startsWith("be-observer")) {
    return eventName;
  }

  if (instanceId) {
    return `com.adobe.commerce.${instanceId}.${eventName}`;
  }

  return `com.adobe.commerce.${eventName}`;
}

/**
 * Generates a valid instance ID from app ID and provider key.
 * Converts to lowercase, replaces invalid characters with underscores,
 * and ensures the result only contains alphanumeric characters, underscores, and hyphens.
 *
 * @param appId - The application ID
 * @param providerKey - The provider key
 * @returns A valid instance ID
 */
function generateInstanceId(appId: string, providerKey: string): string {
  const combined = `${appId}_${providerKey}`;
  return combined
    .toLowerCase()
    .replaceAll(/[^\da-z_-]/g, "_")
    .replaceAll(/_{2,}/g, "_");
}
