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

import { resolveImsAuthParams } from "@adobe/aio-commerce-lib-auth";

import {
  getCommerceEventingExistingData,
  getIoEventsExistingData,
} from "./utils";

import type {
  CommerceEventProvider,
  CommerceEventSubscription,
} from "@adobe/aio-commerce-lib-events/commerce";
import type {
  EventProviderType,
  IoEventRegistration,
} from "@adobe/aio-commerce-lib-events/io-events";
import type { ValidationExecutionContext } from "#management/common/workflow/step";
import type { EventsStepContext } from "./context";
import type { EventingModuleState } from "./types";
import type { IoEventProviderWithMetadata } from "./utils";

/** An I/O provider of one event kind with the live resources that hang off it. */
export type LiveEventingProvider = {
  ioProvider: IoEventProviderWithMetadata;

  /** The app's registrations that deliver events of this provider. */
  registrations: IoEventRegistration[];

  /** The Commerce provider bound to it, for Commerce events. */
  commerceProvider: CommerceEventProvider | null;
};

/** The live eventing state of one event kind. */
export type LiveEventingState = {
  providers: LiveEventingProvider[];

  /**
   * The app's registrations with no events of interest, which link to no provider. I/O drops an
   * event from its registrations when its metadata is deleted.
   */
  emptyRegistrations: IoEventRegistration[];

  /** Every Commerce subscription by name, for Commerce events. Empty for external events. */
  subscriptions: Map<string, CommerceEventSubscription>;

  /** Whether the Commerce eventing module is configured, for Commerce events. */
  eventingModule: Omit<EventingModuleState, "instanceId"> | null;
};

/**
 * Reads the live I/O Events providers of the given type, the app's registrations, and for
 * Commerce events the Commerce providers and subscriptions.
 *
 * @param context - The execution context with the eventing clients.
 * @param type - The provider type to read.
 * @param isCommerce - Whether to also read Commerce eventing state.
 */
export async function readLiveEventingState(
  context: ValidationExecutionContext<EventsStepContext>,
  type: EventProviderType,
  isCommerce: boolean,
): Promise<LiveEventingState> {
  const [io, commerce] = await Promise.all([
    getIoEventsExistingData(context),
    isCommerce ? getCommerceEventingExistingData(context) : null,
  ]);

  const { clientId } = resolveImsAuthParams(context.params);
  const ownRegistrations = io.registrations.filter(
    (registration) => registration.client_id === clientId,
  );

  const providers = io.providersWithMetadata
    .filter((provider) => provider.provider_metadata === type)
    .map((ioProvider) => ({
      commerceProvider:
        commerce?.providers.find(
          (provider) => provider.provider_id === ioProvider.id,
        ) ?? null,
      ioProvider,
      registrations: ownRegistrations.filter((registration) =>
        registration.events_of_interest.some(
          (event) => event.provider_id === ioProvider.id,
        ),
      ),
    }));

  return {
    emptyRegistrations: ownRegistrations.filter(
      (registration) => registration.events_of_interest.length === 0,
    ),
    eventingModule: commerce
      ? {
          isDefaultProviderConfigured: commerce.isDefaultProviderConfigured,
          isDefaultWorkspaceConfigurationEmpty:
            commerce.isDefaultWorkspaceConfigurationEmpty,
        }
      : null,
    providers,
    subscriptions: commerce?.subscriptions ?? new Map(),
  };
}
