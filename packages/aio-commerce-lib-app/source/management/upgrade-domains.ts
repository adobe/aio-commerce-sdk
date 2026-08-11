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

import { eventingUpgradeDomain } from "#management/domains/events/index";
import { executeUpgrade, planUpgrade } from "#management/upgrade/runner";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { LifecycleContext } from "#management/common/workflow/index";
import type {
  UpgradeBaseline,
  UpgradeDomain,
  UpgradeResult,
} from "#management/upgrade/runner";
import type { ConfigDiff } from "#management/upgrade/types";

// Placeholders for the domains whose upgrade support is not implemented yet. Each is an inert
// `UpgradeDomain` (no collectors, no reconcile) so the registry lists every domain and the shape is
// ready to fill in — add a `<domain>/diff.ts` collector set and a `reconcile` when implementing.
// TODO: implement upgrade support for webhooks, admin-ui, custom-installation, and business-config.
const webhooksUpgradeDomain: UpgradeDomain = {
  collectors: [],
  name: "webhooks",
};
const adminUiUpgradeDomain: UpgradeDomain = {
  collectors: [],
  name: "admin-ui",
};
const customInstallationUpgradeDomain: UpgradeDomain = {
  collectors: [],
  name: "custom-installation",
};
const businessConfigUpgradeDomain: UpgradeDomain = {
  collectors: [],
  name: "business-config",
};

/**
 * Every domain that participates in an app upgrade, in reconcile order. Only eventing is
 * implemented; the rest are placeholders (see above) until their upgrade support lands.
 */
export const appUpgradeDomains: UpgradeDomain[] = [
  eventingUpgradeDomain,
  webhooksUpgradeDomain,
  adminUiUpgradeDomain,
  customInstallationUpgradeDomain,
  businessConfigUpgradeDomain,
];

/** Options for {@link runUpgrade} (the domain list is supplied from the built-in registry). */
export type RunUpgradeOptions = {
  baseline: UpgradeBaseline;
  targetConfig: CommerceAppConfigOutputModel;
  context: LifecycleContext;
};

/**
 * Computes the side-effect-free upgrade preview across all built-in domains.
 *
 * @param baselineConfig - The last installed config.
 * @param targetConfig - The config to upgrade to.
 */
export function previewUpgrade(
  baselineConfig: CommerceAppConfigOutputModel,
  targetConfig: CommerceAppConfigOutputModel,
): ConfigDiff {
  return planUpgrade(baselineConfig, targetConfig, appUpgradeDomains);
}

/**
 * Runs an app upgrade across all built-in domains: diffs baseline vs target, refuses unsupported
 * changes, and reconciles each affected domain.
 *
 * @param options - The baseline, target config, and lifecycle context.
 */
export function runUpgrade(options: RunUpgradeOptions): Promise<UpgradeResult> {
  return executeUpgrade({ ...options, domains: appUpgradeDomains });
}
