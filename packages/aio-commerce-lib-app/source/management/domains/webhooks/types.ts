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

import type {
  WebhookSubscribeParams,
  WebhookUnsubscribeParams,
} from "@adobe/aio-commerce-lib-webhooks/api";
import type { DomainPlan } from "#management/common/workflow/resource";

/** Minimal identity fields shared by subscribe and unsubscribe params. */
export type WebhookIdentity = {
  batch_name: string;
  hook_name: string;
  webhook_method: string;
  webhook_type: string;
};

/** Identity of a Commerce webhook that conflicts with a modification webhook from this app. */
export type ConflictingWebhook = WebhookIdentity & {
  label: string;
};

/** Summary of webhook subscription results after a run. */
export type WebhookSubscriptionResult = {
  subscribedWebhooks: WebhookSubscribeParams[];
};

/** Summary of webhook unsubscription results after a run. */
export type WebhookUnsubscriptionResult = {
  unsubscribedWebhooks: WebhookUnsubscribeParams[];
};

/** A fully-resolved webhook payload, minus credentials, plus whether they're required. */
export type ResolvedWebhookPayload = WebhookIdentity &
  Omit<WebhookSubscribeParams, "developer_console_oauth"> & {
    requiresAdobeAuth: boolean;
  };

/**
 * Value carried by an add/remove operation: {@link ResolvedWebhookPayload} with every
 * non-identity field optional, since a cleanup-driven remove may carry only the identity.
 */
export type WebhookOperationValue = WebhookIdentity &
  Partial<Omit<ResolvedWebhookPayload, keyof WebhookIdentity>>;

/** The webhooks domain plan. `retainedWebhooks` lets `apply` rebuild the full resulting state without needing the baseline. */
export type WebhookDomainPlan = DomainPlan<
  WebhookOperationValue,
  WebhookIdentity
> & {
  retainedWebhooks: WebhookSubscribeParams[];
};

/** The snapshot data the webhooks domain persists after applying its plan. */
export type WebhookSnapshotData = WebhookSubscriptionResult;
