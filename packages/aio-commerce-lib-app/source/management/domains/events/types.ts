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

import type { UpdateEventingConfigurationParams } from "@adobe/aio-commerce-lib-events/commerce";
import type { EventProviderType } from "@adobe/aio-commerce-lib-events/io-events";
import type { AppEvent, EventProvider } from "#config/schema/eventing";
import type { DomainPlan } from "#management/common/workflow/resource";
import type { EventsExecutionContext } from "./context";

/** Event data with runtime actions omitted.  */
export type AppEventWithoutRuntimeActions = Omit<AppEvent, "runtimeActions">;

/** The parameters needed to update the eventing module in Commerce. */
export type ConfigureCommerceEventingParams = {
  context: EventsExecutionContext;
  config: UpdateEventingConfigurationParams;
};

/** A single event entry stored in system config after installation. */
export type StoredEventEntry = {
  /** The fully-qualified I/O Events event code. */
  code: string;
  /** Whether the event contains PHI data requiring HIPAA audit. */
  isPhiData: boolean;
};

/** A single provider entry stored in system config after installation. */
export type StoredProviderEntry = {
  /** The I/O Events provider UUID. */
  id: string;
  /** Maps each event's declared `name` to its stored event entry. */
  events: Record<string, StoredEventEntry>;
};

/**
 * Shape of the `system.events` entry written to system storage at installation time.
 * Keyed by `provider.key`.
 */
export type StoredEventsData = {
  providers: Record<string, StoredProviderEntry>;
};

/**
 * One deployed event source recorded after an install/apply, used as the baseline for the next
 * upgrade diff and to reconstruct idempotent onboard/offboard input. `events` is already scoped to
 * the environment the source was deployed under.
 */
export type EventingProviderSnapshot = {
  key: string;
  type: EventProviderType;
  provider: EventProvider;
  events: AppEvent[];
};

/**
 * The snapshot data an eventing leaf persists after applying its plan: the providers and events
 * of the target config it applied. A record only: planning reads live state, not this.
 */
export type EventingSnapshotData = {
  providers: EventingProviderSnapshot[];
};

/**
 * The value carried by a plan operation, discriminated by `resourceType`. Secret-free: creds are
 * resolved fresh at apply from the context, never persisted in a plan.
 */
export type EventingOperationValue =
  | {
      resourceType: "provider";
      providerKey: string;
      type: EventProviderType;
      label: string;
      description?: string;
      providerId?: string;
      instanceId?: string;
    }
  | {
      resourceType: "commerceProvider";
      providerKey: string;
      label: string;
      description?: string;
      providerId?: string;
      commerceProviderId?: string;
      instanceId?: string;
    }
  | {
      resourceType: "metadata";
      providerKey: string;
      type: EventProviderType;
      eventCode: string;
      label: string;
      description?: string;
      providerId?: string;
    }
  | {
      resourceType: "registration";
      providerKey: string;
      type: EventProviderType;
      runtimeAction: string;
      eventCodes: string[];
      name: string;
      description?: string;
      providerId?: string;
      registrationId?: string;
    }
  | {
      resourceType: "subscription";
      providerKey: string;
      name: string;
      providerId?: string;
      changeMode?: "in-place" | "replace";
    };

/**
 * The subscription settings a config can set, in one shape for both the config event and the
 * live Commerce subscription.
 */
export type SubscriptionValues = {
  fields: { name: string; source?: string }[];
  rules?: { field: string; operator: string; value: string }[];
  priority?: boolean;
  hipaa_audit_required?: boolean;
};

/** What apply needs to configure the Commerce eventing module, read while planning. */
export type EventingModuleState = {
  /** The instance id of the first target provider, for the module's default provider. */
  instanceId: string;
  isDefaultProviderConfigured: boolean;
  isDefaultWorkspaceConfigurationEmpty: boolean;
};

export type EventingDomainPlan = DomainPlan<EventingOperationValue> & {
  /**
   * Subscription values a config of ours set, keyed by subscription name: from the baseline,
   * the latest failed attempt's target, and the values that attempt's plan carried.
   */
  configuredValues?: Record<string, Partial<SubscriptionValues>[]>;

  /** The I/O provider ids of the target providers that exist live, keyed by provider key. */
  providerIds?: Record<string, string>;

  /** The Commerce eventing module state, when the Commerce leaf has target providers. */
  eventingModule?: EventingModuleState;
};
