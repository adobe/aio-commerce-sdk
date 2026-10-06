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

import { fieldValuesEqual, isUnset } from "#management/common/utils/values";

import type { CommerceWebhook } from "@adobe/aio-commerce-lib-webhooks/api";
import type { WebhookEntry } from "#config/schema/webhooks";
import type { ValidationIssue } from "#management/common/workflow/validation";
import type {
  ConflictingWebhook,
  ResolvedWebhookPayload,
  WebhookOperationValue,
} from "./types";

/** Mutable (non-identity) scalar fields compared to detect a config change. */
const MUTABLE_SCALAR_FIELDS = [
  "url",
  "priority",
  "method",
  "required",
  "soft_timeout",
  "timeout",
  "fallback_error_message",
  "ttl",
  "batch_order",
  "requiresAdobeAuth",
] as const satisfies (keyof ResolvedWebhookPayload)[];

/** Mutable (non-identity) array fields compared to detect a config change. */
const MUTABLE_ARRAY_FIELDS = [
  "fields",
  "rules",
  "headers",
] as const satisfies (keyof ResolvedWebhookPayload)[];

/** Every mutable (non-identity) field compared to detect a config change. */
const MUTABLE_FIELDS = [...MUTABLE_SCALAR_FIELDS, ...MUTABLE_ARRAY_FIELDS];

/**
 * True when a live webhook differs from its target. A field the target sets must match
 * exactly. A field the target leaves out only differs when live still holds a value a
 * config set for it (`configured`), since otherwise it holds Commerce's own value.
 * `batch_name`/`hook_name`/`webhook_method`/`webhook_type` are identity fields — a change
 * there is a rename (remove+add), not a config update.
 */
export function hasWebhookConfigChanged(
  live: WebhookOperationValue,
  target: WebhookOperationValue,
  configured: readonly Partial<ResolvedWebhookPayload>[] = [],
): boolean {
  return MUTABLE_FIELDS.some((field) => {
    const liveValue = live[field];
    const targetValue = target[field];

    if (targetValue !== undefined) {
      return !fieldValuesEqual(liveValue, targetValue);
    }

    // Commerce always returns a value, so for a field the target leaves out only a value one
    // of our configs set proves live is stale. Any other value is Commerce's own.
    const configuredValues = configured
      .map((webhook) => webhook[field])
      .filter((value) => !isUnset(value));

    return configuredValues.some((value) => fieldValuesEqual(liveValue, value));
  });
}

/**
 * Finds the live webhooks of another app that conflict with the given modification webhooks:
 * same `webhook_method` and `webhook_type`, different batch or hook name.
 *
 * @param entries - The app's modification webhook entries.
 * @param live - The webhooks registered in Commerce.
 * @param idPrefix - The app's batch and hook name prefix.
 */
export function findConflictingWebhooks(
  entries: WebhookEntry[],
  live: CommerceWebhook[],
  idPrefix: string,
): ConflictingWebhook[] {
  return entries.flatMap((entry) => {
    const { webhook } = entry;
    const conflicting = live.find((existing) => {
      const isSameHookPoint =
        existing.webhook_method === webhook.webhook_method &&
        existing.webhook_type === webhook.webhook_type;

      const isSameWebhook =
        existing.batch_name === `${idPrefix}${webhook.batch_name}` &&
        existing.hook_name === `${idPrefix}${webhook.hook_name}`;

      return isSameHookPoint && !isSameWebhook;
    });

    return conflicting ? [{ label: entry.label, ...conflicting }] : [];
  });
}

/** The `WEBHOOK_CONFLICTS` warning for the given conflicts, or none when there are none. */
export function toWebhookConflictIssues(
  conflicts: ConflictingWebhook[],
): ValidationIssue[] {
  if (conflicts.length === 0) {
    return [];
  }

  return [
    {
      code: "WEBHOOK_CONFLICTS",
      details: { conflictedWebhooks: conflicts },
      message: `Webhook conflicts detected: ${conflicts.length} webhook(s) already registered for the same method and type by another app`,
      severity: "warning",
    },
  ];
}
