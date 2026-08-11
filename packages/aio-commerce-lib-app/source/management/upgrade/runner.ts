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

import {
  configHasUnsupportedChange,
  diffConfig,
  getOperativeChanges,
  isEmptyPlan,
} from "./diff";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { LifecycleContext } from "#management/common/workflow/index";
import type { ConfigDiff, DomainCollector, ResourceChange } from "./types";

/** The previously installed state an upgrade diffs against. */
export type UpgradeBaseline = {
  /** The last successfully installed configuration. */
  config: CommerceAppConfigOutputModel;
};

/**
 * One domain's participation in an upgrade: pure collectors that feed the diff/preview, and an
 * optional reconcile that converges deployed state from the baseline config to the target config.
 * Domains without a deployed resource (e.g. business configuration) contribute collectors only.
 */
export type UpgradeDomain = {
  /** Human-readable label for logging. */
  name: string;

  /** The pure diff collectors this domain owns. */
  collectors: DomainCollector[];

  /**
   * Converges this domain's deployed resources to the target config. Reuses the domain's own
   * idempotent install/uninstall and issues targeted API calls for the residue, resolving
   * resource ids from live state. Omitted for collector-only domains.
   */
  reconcile?: (
    input: {
      baseline: UpgradeBaseline;
      targetConfig: CommerceAppConfigOutputModel;
    },
    context: LifecycleContext,
  ) => Promise<void>;
};

/** Outcome of an upgrade run. */
export type UpgradeStatus = "empty" | "applied";

/** The result of {@link executeUpgrade}: the computed diff and whether any reconcile ran. */
export type UpgradeResult = {
  diff: ConfigDiff;
  status: UpgradeStatus;
};

/** Options for {@link executeUpgrade}. */
export type ExecuteUpgradeOptions = {
  baseline: UpgradeBaseline;
  targetConfig: CommerceAppConfigOutputModel;
  context: LifecycleContext;
  domains: UpgradeDomain[];
};

/** Thrown when an upgrade contains a change the reconcile engine cannot apply today. */
export class UnsupportedUpgradeError extends Error {
  /** The unsupported operative changes that blocked the upgrade. */
  public readonly changes: ResourceChange[];

  public constructor(changes: ResourceChange[]) {
    const identities = changes
      .map((c) => `${c.domain}:${c.identity}`)
      .join(", ");
    super(`Upgrade contains unsupported changes: ${identities}`);
    this.name = "UnsupportedUpgradeError";
    this.changes = changes;
  }
}

/**
 * Computes the side-effect-free upgrade diff across every provided domain's collectors. Suitable
 * for a preview: no external calls, pure over the two config objects.
 *
 * @param baselineConfig - The last installed config.
 * @param targetConfig - The config to upgrade to.
 * @param domains - The participating domains whose collectors drive the diff.
 */
export function planUpgrade(
  baselineConfig: CommerceAppConfigOutputModel,
  targetConfig: CommerceAppConfigOutputModel,
  domains: UpgradeDomain[],
): ConfigDiff {
  return diffConfig(
    baselineConfig,
    targetConfig,
    domains.flatMap((domain) => domain.collectors),
  );
}

/** Whether the diff has an operative change in any domain owned by the given upgrade domain. */
function domainHasOperativeChange(
  diff: ConfigDiff,
  domain: UpgradeDomain,
): boolean {
  const owned = new Set(domain.collectors.map((collector) => collector.domain));
  return getOperativeChanges(diff).some((change) => owned.has(change.domain));
}

/**
 * Runs an upgrade: computes the diff, refuses unsupported changes, then reconciles each domain that
 * has operative changes. Reconcile is skipped entirely when the diff is empty.
 *
 * @throws {@link UnsupportedUpgradeError} when the diff contains a change no domain can apply.
 */
export async function executeUpgrade(
  options: ExecuteUpgradeOptions,
): Promise<UpgradeResult> {
  const { baseline, targetConfig, context, domains } = options;
  const diff = planUpgrade(baseline.config, targetConfig, domains);

  if (configHasUnsupportedChange(diff)) {
    throw new UnsupportedUpgradeError(
      getOperativeChanges(diff).filter((change) => !change.supported),
    );
  }

  if (isEmptyPlan(diff)) {
    context.logger.debug("Upgrade diff is empty; nothing to reconcile.");
    return { diff, status: "empty" };
  }

  for (const domain of domains) {
    if (!(domain.reconcile && domainHasOperativeChange(diff, domain))) {
      continue;
    }

    context.logger.debug(`Reconciling upgrade domain "${domain.name}".`);
    // biome-ignore lint/performance/noAwaitInLoops: domains are reconciled sequentially to avoid a burst of Commerce / Adobe I/O API calls
    await domain.reconcile({ baseline, targetConfig }, context);
  }

  return { diff, status: "applied" };
}
