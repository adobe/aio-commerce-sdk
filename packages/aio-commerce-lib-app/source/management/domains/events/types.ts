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
import type {
  EventProviderType,
  IoEventProvider,
} from "@adobe/aio-commerce-lib-events/io-events";
import type { ArrayElement } from "type-fest";
import type {
  AppEvent,
  CommerceEvent,
  EventProvider,
} from "#config/schema/eventing";
import type { ApplicationMetadata } from "#config/schema/metadata";
import type { DomainPlan } from "#management/common/workflow/resource";
import type { onboardIoEvents } from "#management/domains/events/helpers";
import type { EventsExecutionContext } from "./context";

/** Augmented provider data with it's type. */
export type ProviderWithType = EventProvider & { type: EventProviderType };

/** Parameters needed to create a provider in Adobe I/O Events */
export type CreateIoProviderParams = {
  context: EventsExecutionContext;
  provider: ProviderWithType & { instanceId: string };
};

/** Parameters needed to create event metadata of a provider in Adobe I/O Events */
export type CreateIoProviderEventsMetadataParams = {
  metadata: ApplicationMetadata;
  context: EventsExecutionContext;
  type: EventProviderType;
  provider: IoEventProvider;
  event: AppEvent;
};

/** Event data with runtime actions omitted.  */
export type AppEventWithoutRuntimeActions = Omit<AppEvent, "runtimeActions">;

/** Parameters needed to create event event registrations in Adobe I/O Events. */
export type CreateRegistrationParams = {
  context: EventsExecutionContext;
  metadata: ApplicationMetadata;
  events: AppEventWithoutRuntimeActions[];
  provider: IoEventProvider;
  runtimeAction: string;
};

/** Parameters needed to onboard all the entities of Adobe I/O Events. */
export type OnboardIoEventsParams<EventType extends AppEvent> = {
  context: EventsExecutionContext;
  metadata: ApplicationMetadata;
  provider: EventProvider;
  events: EventType[];
  providerType: EventProviderType;
};

/** The returned data of an onboarded Adobe I/O event provider. */
export type ProviderDataFromIo<EventType extends AppEvent> = Awaited<
  ReturnType<typeof onboardIoEvents<EventType>>
>["providerData"];

/** The returned data of onboarded Adobe I/O events. */
export type EventsDataFromIo<EventType extends AppEvent> = Awaited<
  ReturnType<typeof onboardIoEvents<EventType>>
>["eventsData"];

/** The parameters needed to update the eventing module in Commerce. */
export type ConfigureCommerceEventingParams = {
  context: EventsExecutionContext;
  config: UpdateEventingConfigurationParams;
};

/** The parameters needed to create an event provider in Commerce */
export type CreateCommerceProviderParams = {
  context: EventsExecutionContext;
  provider: Pick<
    IoEventProvider,
    "label" | "description" | "instance_id" | "id"
  > & { workspace_configuration: string };
};

/** The parameters needed to create event subscriptions in Commerce. */
export type CreateCommerceEventSubscriptionParams = {
  context: EventsExecutionContext;
  metadata: ApplicationMetadata;
  provider: ProviderDataFromIo<CommerceEvent>;
  event: ArrayElement<EventsDataFromIo<CommerceEvent>>;
};

/** The parameters needed to onboard all the entities of Commerce Eventing. */
export type OnboardCommerceEventingParams = {
  context: EventsExecutionContext;
  metadata: ApplicationMetadata;
  provider: EventProvider;

  ioData: {
    provider: ProviderDataFromIo<CommerceEvent>;
    events: EventsDataFromIo<CommerceEvent>;
    workspaceConfiguration: string;
  };
};

/** Parameters shared by `offboardIoEvents` and `offboardCommerceEventing`. */
export type OffboardEventsParams = {
  context: EventsExecutionContext;
  metadata: ApplicationMetadata;
  provider: EventProvider;
  events: AppEvent[];
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
 * The snapshot data an eventing leaf persists after applying its plan: the set of providers (with
 * their deployed events) it currently owns. Serves as `baseline.data` for the next plan.
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
    }
  | {
      resourceType: "metadata";
      providerKey: string;
      type: EventProviderType;
      eventCode: string;
      label: string;
      description?: string;
    }
  | {
      resourceType: "registration";
      providerKey: string;
      type: EventProviderType;
      runtimeAction: string;
      eventCodes: string[];
    }
  | {
      resourceType: "subscription";
      providerKey: string;
      name: string;
    };

/** A cleanup resource identity for one eventing resource, matched during apply/teardown. */
export type EventingCleanupIdentity =
  | { resourceType: "provider"; providerKey: string }
  | { resourceType: "metadata"; providerKey: string; eventCode: string }
  | { resourceType: "registration"; providerKey: string; runtimeAction: string }
  | { resourceType: "subscription"; name: string };

/**
 * An eventing domain plan. Beyond the generic operations/cleanup, it carries the provider sets apply
 * needs to converge deployed state idempotently: `targetProviders` to onboard, `removedProviders` to
 * offboard, and `baselineProviders` to compute sub-resource removals on providers present in both.
 */
export type EventingDomainPlan = DomainPlan<
  EventingOperationValue,
  EventingCleanupIdentity
> & {
  /** The target app metadata, used to namespace event codes/names when onboarding. */
  metadata: ApplicationMetadata;

  /** The baseline app metadata, used to resolve deployed resources during teardown. Null on first upgrade. */
  baselineMetadata: ApplicationMetadata | null;

  targetProviders: EventingProviderSnapshot[];
  removedProviders: EventingProviderSnapshot[];
  baselineProviders: EventingProviderSnapshot[];
};
