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

import { hasWebhookConfigChanged } from "./comparison";
import {
  resolveDesiredWebhooks,
  resolveWebhookItemRefs,
  webhookKey,
} from "./utils";

import type { getInstallCommerceEnv } from "#config/lib/environment";
import type { WebhooksConfig } from "#config/schema/webhooks";
import type { ResourceChange } from "#management/common/workflow/resource";
import type { ResolvedWebhookPayload } from "./types";

type WebhooksChangesConfig = Pick<WebhooksConfig, "metadata" | "webhooks">;

/**
 * The webhooks the target declares that the baseline does not (`add`), the other way around
 * (`remove`), and those both declare with a config the planner would update (`update`). Only the
 * webhooks that apply to the environment count.
 *
 * @param baselineConfig - The installed config, or `null` when the domain was absent.
 * @param targetConfig - The config to install, or `null` when the domain should be absent.
 * @param env - The Commerce environment the app is installed in.
 */
export function planWebhookChanges(
  baselineConfig: WebhooksChangesConfig | null,
  targetConfig: WebhooksChangesConfig | null,
  env: ReturnType<typeof getInstallCommerceEnv>,
): ResourceChange[] {
  const baseline = toKeyed(baselineConfig, env);
  const target = toKeyed(targetConfig, env);
  const refs = {
    baseline: resolveWebhookItemRefs(baselineConfig, env),
    target: resolveWebhookItemRefs(targetConfig, env),
  };

  const changes: ResourceChange[] = [];
  for (const [key, after] of target) {
    const before = baseline.get(key);
    const itemRef = refs.target.get(key);

    // The baseline is its own evidence, so a field the target drops counts as changed.
    if (
      itemRef &&
      (!before || hasWebhookConfigChanged(before, after, [before]))
    ) {
      changes.push({ itemRef, key, kind: before ? "update" : "add" });
    }
  }

  for (const key of baseline.keys()) {
    const itemRef = refs.baseline.get(key);
    if (itemRef && !target.has(key)) {
      changes.push({ itemRef, key, kind: "remove" });
    }
  }

  return changes;
}

/** The resolved webhooks of a config that apply to the environment, by `webhookKey`. */
function toKeyed(
  config: WebhooksChangesConfig | null,
  env: ReturnType<typeof getInstallCommerceEnv>,
): Map<string, ResolvedWebhookPayload> {
  return new Map(
    (config ? resolveDesiredWebhooks(config, env) : []).map((webhook) => [
      webhookKey(webhook),
      webhook,
    ]),
  );
}
