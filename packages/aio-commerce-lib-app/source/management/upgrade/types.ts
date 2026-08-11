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

/** A single resource-level change between the installed snapshot and the target config. */
export type ResourceChange = {
  /**
   * The domain this resource belongs to. A free-form string so any domain can register
   * its own collectors with the engine without modifying it.
   */
  domain: string;

  /** Version-stable immutable identity used to match old vs new (e.g. subscription name). */
  identity: string;

  /** How the resource changed. */
  kind: ResourceKind;

  /** True when applying this change can lose merchant data or silently remove merchant-visible behavior. */
  destructive: boolean;

  /** True when the reconcile engine can apply this change today (see {@link DomainRule.unsupportedOnChange}). */
  supported: boolean;

  /** The resource shape in the installed snapshot (absent for `added`). */
  before?: unknown;

  /** The resource shape in the target config (absent for `removed`). */
  after?: unknown;
};

/** The full diff between two configs, across every registered domain. */
export type ConfigDiff = {
  changes: ResourceChange[];
};

/** How the engine classifies removals and in-place changes for a single domain. */
export type DomainRule = {
  /** True when removing a resource in this domain loses merchant data or behavior. */
  destructiveOnRemove: boolean;

  /** True when the reconcile engine cannot apply an in-place `changed` for this domain today. */
  unsupportedOnChange: boolean;
};

/**
 * Reduces a config to the set of resources a single domain owns, keyed by version-stable
 * identity. A domain contributes one collector per resource type it manages. Identity keys
 * must match what the installation flow actually creates so a reconcile can match the
 * installed snapshot against the target config.
 */
export type DomainCollector = {
  /** The domain label stamped onto every {@link ResourceChange} this collector produces. */
  domain: string;

  /** Reduces a config to `Map<identity, comparableShape>` for this domain's resources. */
  collect: (config: CommerceAppConfigOutputModel) => Map<string, unknown>;

  /** Classification applied to this domain's removals and in-place changes. */
  rule: DomainRule;
};
