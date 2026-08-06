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

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** Whether a managed resource is added, removed, changed, or unchanged between versions. */
export type ResourceKind = "added" | "removed" | "changed" | "unchanged";

/** The managed-resource domains the diff engine reasons about. */
export type ResourceDomain =
  | "ioEventsRegistration"
  | "ioEventsProvider"
  | "ioEventsMetadata"
  | "commerceSubscription"
  | "commerceWebhook"
  | "adminUi"
  | "customStep"
  | "businessConfig";

/** A single resource-level change between the installed snapshot and the target config. */
export type ResourceChange = {
  /** The domain this resource belongs to. */
  domain: ResourceDomain;

  /** Version-stable immutable identity used to match old vs new (e.g. subscription name). */
  identity: string;

  /** How the resource changed. */
  kind: ResourceKind;

  /** True when applying this change can lose merchant data or silently remove merchant-visible behavior. */
  destructive: boolean;

  /**
   * True when the reconcile engine can apply this change today. `changed` is `false` for:
   * Commerce subscriptions/webhooks, until the Commerce PUT endpoints (spec §7.1/§7.2)
   * land; and I/O Events providers/metadata, which have no PUT wrapper to update a
   * deployed resource in place. I/O Events registrations ARE supported (full-replace PUT
   * via `updateRegistration`).
   */
  supported: boolean;

  /** The resource shape in the installed snapshot (absent for `added`). */
  before?: unknown;

  /** The resource shape in the target config (absent for `removed`). */
  after?: unknown;
};

/** The full diff between two configs. */
export type ConfigDiff = {
  changes: ResourceChange[];
};

/** A stored, reviewable update plan; executed verbatim by `/update` (spec §8.4). */
export type UpdatePlan = {
  /** Consent/staleness token generated at preview. */
  planId: string;

  /** The computed diff. */
  diff: ConfigDiff;

  /** The full target config the plan advances the snapshot to on success. */
  targetConfig: CommerceAppConfigOutputModel;

  /** ISO timestamp the plan was created. */
  createdAt: string;
};

/** One resource an in-flight update may touch; consumed by uninstall teardown (spec §11). */
export type CleanupEntry = {
  domain: ResourceDomain;
  identity: string;
};

/** The set of resources the in-flight update may create/modify/remove. */
export type CleanupList = {
  entries: CleanupEntry[];
};
