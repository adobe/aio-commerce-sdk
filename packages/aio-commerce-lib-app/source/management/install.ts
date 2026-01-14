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

import { createAdobeIoEventsApiClient } from "@adobe/aio-commerce-lib-events/io-events";

import { installCommerceEvents } from "~/management/event-subscription";

import type {
  AdobeIoEventsApiClient,
  IoEventProviderManyResponse,
  IoEventProviderOneResponse,
} from "@adobe/aio-commerce-lib-events/io-events";
import type { CommerceAppConfigOutputModel } from "~/config/schema/app";
import type { ImsCredentials, WorkspaceContext } from "./types";

let cachedClient: AdobeIoEventsApiClient | null = null;

/**
 * Installs the Commerce app based on the provided configuration.
 *
 * @param appConfig - The Commerce app configuration
 * @param credentials - IMS credentials for authentication
 * @param workspaceContext - Installation context containing organization, project, and workspace IDs
 * @returns A promise that resolves when installation is complete
 */
export async function installApp(
  appConfig: CommerceAppConfigOutputModel,
  credentials: ImsCredentials,
  workspaceContext: WorkspaceContext,
): Promise<void> {
  try {
    await installCommerceProvidersAndMetadata(
      appConfig,
      credentials,
      workspaceContext,
    );

    await installCommerceEvents(
      appConfig,
      { AIO_COMMERCE_API_BASE_URL: "" },
      new Map(),
    );
  } catch (error) {
    console.error("Failed to install app:", error);
    throw error;
  }
}

/**
 * Installs Commerce event providers and their associated events.
 *
 * @param appConfig - The Commerce app configuration
 * @param credentials - IMS credentials for authentication
 * @param workspaceContext - Installation context containing organization, project, and workspace IDs
 */
async function installCommerceProvidersAndMetadata(
  appConfig: CommerceAppConfigOutputModel,
  credentials: ImsCredentials,
  workspaceContext: WorkspaceContext,
): Promise<void> {
  if (!appConfig.eventing?.commerce) {
    console.log(
      "No commerce eventing configuration found. Skipping commerce provider installation.",
    );
    return;
  }

  const ioEventsClient = getIoEventsClient(credentials);

  for (const commerceProvider of appConfig.eventing.commerce) {
    const instanceId = generateInstanceId(
      appConfig.metadata.id,
      commerceProvider.provider.key ?? commerceProvider.provider.label,
    );
    const allProviders = await ioEventsClient.getAllEventProviders({
      consumerOrgId: workspaceContext.orgId,
    });
    const provider = findProviderByInstanceId(allProviders, instanceId);

    if (!provider) {
      console.log(`No provider found for commerce provider ${instanceId}`);
      console.log(
        `Creating Commerce Provider: ${commerceProvider.provider.label}`,
      );

      const provider = await ioEventsClient.createCommerceEventProvider({
        consumerOrgId: workspaceContext.orgId,
        projectId: workspaceContext.projectId,
        workspaceId: workspaceContext.workspaceId,
        instanceId,
        label: commerceProvider.provider.label,
        description: commerceProvider.provider.description,
      });

      console.log(`Created Commerce Provider: ${provider.id}`);
    }

    if (!provider) {
      console.error(
        `Failed to create or retrieve provider for instance ID: ${instanceId}`,
      );
      continue;
    }

    for (const event of commerceProvider.events) {
      console.log(`Creating event: ${event.name} for provider: ${provider.id}`);

      const eventMetadata = await ioEventsClient.createEventMetadataForProvider(
        {
          consumerOrgId: workspaceContext.orgId,
          projectId: workspaceContext.projectId,
          workspaceId: workspaceContext.workspaceId,
          providerId: provider.id,
          description: event.description ?? "",
          label: event.name ?? "",
          eventCode: `com.adobe.commerce.${event.name}`,
        },
      );

      console.log(`Created event: ${eventMetadata.event_code}`);
    }
  }
}

/**
 * Finds an event provider by instance ID from the getAllEventProviders response.
 *
 * @param allProvidersResponse - Response from getAllEventProviders
 * @param targetInstanceId - The instance ID to search for
 * @returns The matching provider or undefined if not found
 */
function findProviderByInstanceId(
  allProvidersResponse: IoEventProviderManyResponse,
  targetInstanceId: string,
): IoEventProviderOneResponse | undefined {
  return allProvidersResponse.embedded.providers.find(
    (provider) => provider.instanceId === targetInstanceId,
  );
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

/**
 * Gets or creates an Adobe I/O Events API client using IMS credentials.
 * The client is lazily initialized and cached for subsequent calls.
 *
 * @param credentials - IMS credentials for authentication
 * @returns Adobe I/O Events API client instance
 */
function getIoEventsClient(credentials: ImsCredentials) {
  if (cachedClient === null) {
    cachedClient = createAdobeIoEventsApiClient({
      auth: {
        clientId: credentials.client_id,
        clientSecrets: credentials.client_secrets,
        technicalAccountId: credentials.technical_account_id,
        technicalAccountEmail: credentials.technical_account_email,
        scopes: credentials.scopes,
        imsOrgId: credentials.ims_org_id,
      },
    });
  }

  return cachedClient;
}
