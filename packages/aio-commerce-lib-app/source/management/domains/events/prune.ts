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

import { unwrapHttpError } from "@adobe/aio-commerce-lib-api/utils";

import { deleteIoEventMetadata, deleteIoEventProvider } from "./helpers";
import {
  eventCodeOf,
  generateInstanceId,
  generateInstanceIdDeprecated,
  getCommerceEventingExistingData,
  getIoEventsExistingData,
  getNamespacedEvent,
  isCommerceEventResourceOwnedByApp,
  isIoProviderProvenOwnedByApp,
} from "./utils";

import type { EventProviderType } from "@adobe/aio-commerce-lib-events/io-events";
import type { ApplicationMetadata } from "#config/schema/metadata";
import type { ApplyContext } from "#management/common/workflow/resource";
import type { LeafApplyOptions } from "./apply";
import type { EventsStepContext } from "./context";
import type { EventingDomainPlan, EventingProviderSnapshot } from "./types";
import type {
  ExistingCommerceEventingData,
  ExistingIoEventsData,
  IoEventProviderWithMetadata,
} from "./utils";

/** The provider-type discriminators the eventing prune pass needs. */
export type PruneEventingOptions = Pick<
  LeafApplyOptions,
  "type" | "isCommerce"
>;

/**
 * Prunes eventing resources this app owns in this workspace that the target no longer declares,
 * including stale sub-resources of providers the target still wants. Every listing and deleting
 * error is logged and never rethrown, so the prune lane can never fail the attempt.
 */
export async function pruneEventingLeaf(
  plan: EventingDomainPlan,
  context: ApplyContext<EventsStepContext>,
  options: PruneEventingOptions,
): Promise<void> {
  const { appData, appId, logger } = context;
  const { workspaceId } = appData;

  let existingData: ExistingIoEventsData;
  try {
    existingData = await getIoEventsExistingData(context);
  } catch (error) {
    logger.warn(
      `Failed to list I/O Events providers for pruning: ${await unwrapHttpError(error)}. Skipping prune lane.`,
    );

    return;
  }

  const ownedProviders = existingData.providersWithMetadata.filter(
    (provider) =>
      provider.provider_metadata === options.type &&
      isIoProviderProvenOwnedByApp(provider.instance_id, appId, workspaceId),
  );

  if (ownedProviders.length === 0) {
    return;
  }

  const { staleProviders, wantedProviders } = splitOwnedProviders(
    ownedProviders,
    plan,
    workspaceId,
  );

  const ownedIoProviderIds = new Set(ownedProviders.map((p) => p.id));
  const staleIoProviderIds = new Set(staleProviders.map((p) => p.id));

  let commerceData: ExistingCommerceEventingData | undefined;
  if (options.isCommerce) {
    try {
      commerceData = await getCommerceEventingExistingData(context);
    } catch (error) {
      logger.warn(
        `Failed to list Commerce eventing resources for pruning: ${await unwrapHttpError(error)}. Skipping Commerce prune.`,
      );
    }
  }

  if (commerceData) {
    await pruneCommerceResources(
      wantedProviders,
      ownedIoProviderIds,
      staleIoProviderIds,
      commerceData,
      plan.targetMetadata as ApplicationMetadata,
      context,
    );
  }

  await pruneWantedProviderMetadata(
    wantedProviders,
    options.type,
    plan.targetMetadata as ApplicationMetadata,
    context,
  );

  for (const provider of staleProviders) {
    // biome-ignore lint/performance/noAwaitInLoops: prune deletes run sequentially to avoid an Adobe I/O Events rate-limit burst
    await offboardStaleIoProvider(provider, existingData, context);
  }
}

/** A wanted provider is a live owned provider whose instance id matches a target provider. */
type WantedProvider = {
  provider: IoEventProviderWithMetadata;
  target: EventingProviderSnapshot;
};

/** Owned providers split into ones the target still wants and stale ones to fully offboard. */
type OwnedProviderSplit = {
  staleProviders: IoEventProviderWithMetadata[];
  wantedProviders: WantedProvider[];
};

/** Splits owned providers into ones the target still wants and stale ones to fully offboard. */
function splitOwnedProviders(
  ownedProviders: IoEventProviderWithMetadata[],
  plan: EventingDomainPlan,
  workspaceId: string,
): OwnedProviderSplit {
  const targetByInstanceId = new Map<string, EventingProviderSnapshot>();
  if (plan.targetMetadata) {
    for (const target of plan.targetProviders) {
      targetByInstanceId.set(
        generateInstanceId(plan.targetMetadata, target.provider, workspaceId),
        target,
      );
      targetByInstanceId.set(
        generateInstanceIdDeprecated(plan.targetMetadata, target.provider),
        target,
      );
    }
  }

  const plannedRemoved = new Set<string>();
  if (plan.baselineMetadata) {
    for (const removed of plan.removedProviders) {
      plannedRemoved.add(
        generateInstanceId(
          plan.baselineMetadata,
          removed.provider,
          workspaceId,
        ),
      );
      plannedRemoved.add(
        generateInstanceIdDeprecated(plan.baselineMetadata, removed.provider),
      );
    }
  }

  const staleProviders: IoEventProviderWithMetadata[] = [];
  const wantedProviders: WantedProvider[] = [];

  for (const provider of ownedProviders) {
    const target = targetByInstanceId.get(provider.instance_id);
    if (target) {
      wantedProviders.push({ provider, target });
    } else if (!plannedRemoved.has(provider.instance_id)) {
      staleProviders.push(provider);
    }
  }

  return { staleProviders, wantedProviders };
}

/** Deletes I/O Events metadata on wanted providers whose event code the target no longer declares. */
async function pruneWantedProviderMetadata(
  wantedProviders: WantedProvider[],
  type: EventProviderType,
  targetMetadata: ApplicationMetadata,
  context: ApplyContext<EventsStepContext>,
): Promise<void> {
  const { ioEventsClient, appData, logger } = context;
  const appCredentials = {
    consumerOrgId: appData.consumerOrgId,
    projectId: appData.projectId,
    workspaceId: appData.workspaceId,
  };

  for (const { provider, target } of wantedProviders) {
    const wantedCodes = new Set(
      target.events.map((event) => eventCodeOf(event, targetMetadata, type)),
    );

    for (const metadata of provider.metadata) {
      if (wantedCodes.has(metadata.event_code)) {
        continue;
      }

      try {
        // biome-ignore lint/performance/noAwaitInLoops: prune deletes run sequentially to avoid an Adobe I/O Events rate-limit burst
        await ioEventsClient.deleteEventMetadataForProvider({
          ...appCredentials,
          eventCode: metadata.event_code,
          providerId: provider.id,
        });

        logger.info(
          `Pruned stale event metadata "${metadata.event_code}" of provider "${provider.label}".`,
        );
      } catch (error) {
        logger.warn(
          `Failed to prune event metadata "${metadata.event_code}" of provider "${provider.label}": ${await unwrapHttpError(error)}. Continuing apply.`,
        );
      }
    }
  }
}

/**
 * Deletes owned Commerce subscriptions that sit on a stale provider or that the target no longer
 * declares, then the Commerce providers of stale providers.
 */
async function pruneCommerceResources(
  wantedProviders: WantedProvider[],
  ownedIoProviderIds: ReadonlySet<string>,
  staleIoProviderIds: ReadonlySet<string>,
  commerceData: ExistingCommerceEventingData,
  targetMetadata: ApplicationMetadata,
  context: ApplyContext<EventsStepContext>,
): Promise<void> {
  const { commerceEventsClient, logger } = context;
  const wantedNames = new Set(
    wantedProviders.flatMap(({ target }) =>
      target.events.map((event) =>
        getNamespacedEvent(targetMetadata, event.name),
      ),
    ),
  );

  for (const subscription of commerceData.subscriptions.values()) {
    const isOwned = isCommerceEventResourceOwnedByApp(
      subscription.provider_id,
      ownedIoProviderIds,
    );

    const isUnwanted =
      staleIoProviderIds.has(subscription.provider_id) ||
      !wantedNames.has(subscription.name);

    if (!(isOwned && isUnwanted)) {
      continue;
    }

    try {
      // biome-ignore lint/performance/noAwaitInLoops: prune deletes run sequentially to avoid a Commerce rate-limit burst
      await commerceEventsClient.deleteEventSubscription({
        name: subscription.name,
      });

      logger.info(`Pruned stale Commerce subscription "${subscription.name}".`);
    } catch (error) {
      logger.warn(
        `Failed to prune Commerce subscription "${subscription.name}": ${await unwrapHttpError(error)}. Continuing apply.`,
      );
    }
  }

  for (const provider of commerceData.providers) {
    if (
      !(
        provider.id &&
        isCommerceEventResourceOwnedByApp(provider.id, staleIoProviderIds)
      )
    ) {
      continue;
    }

    try {
      // biome-ignore lint/performance/noAwaitInLoops: prune deletes run sequentially to avoid a Commerce rate-limit burst
      await commerceEventsClient.deleteEventProvider({
        provider_id: provider.provider_id,
      });

      logger.info(
        `Pruned stale Commerce event provider "${provider.provider_id}".`,
      );
    } catch (error) {
      logger.warn(
        `Failed to prune Commerce event provider "${provider.provider_id}": ${await unwrapHttpError(error)}. Continuing apply.`,
      );
    }
  }
}

/** Offboards a single stale I/O provider: owned registrations, then metadata, then the provider. */
async function offboardStaleIoProvider(
  provider: IoEventProviderWithMetadata,
  existingData: ExistingIoEventsData,
  context: ApplyContext<EventsStepContext>,
): Promise<void> {
  const { ioEventsClient, appData, params, logger } = context;
  const appCredentials = {
    consumerOrgId: appData.consumerOrgId,
    projectId: appData.projectId,
    workspaceId: appData.workspaceId,
  };

  const clientId = params.AIO_COMMERCE_AUTH_IMS_CLIENT_ID;

  // Registrations owned by this workspace credential that point at the pruned provider. The list
  // endpoint may not populate events_of_interest; such registrations cannot be linked here and are
  // left for the offboard-by-name path.
  const ownedRegistrations = existingData.registrations.filter(
    (registration) =>
      registration.client_id === clientId &&
      registration.events_of_interest.some(
        (event) => event.provider_id === provider.id,
      ),
  );

  for (const registration of ownedRegistrations) {
    try {
      // biome-ignore lint/performance/noAwaitInLoops: prune deletes run sequentially to avoid an Adobe I/O Events rate-limit burst
      await ioEventsClient.deleteRegistration({
        ...appCredentials,
        registrationId: registration.registration_id,
      });

      logger.info(`Pruned stale registration "${registration.name}".`);
    } catch (error) {
      logger.warn(
        `Failed to prune registration "${registration.name}": ${await unwrapHttpError(error)}. Continuing.`,
      );
    }
  }

  await deleteIoEventMetadata(provider, context);
  await deleteIoEventProvider(provider, context);
}
