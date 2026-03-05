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

import * as v from "valibot";

function nonEmptyString(fieldName: string) {
  return v.pipe(
    v.string(`Expected a string for ${fieldName}`),
    v.nonEmpty(`${fieldName} must not be empty`),
  );
}

function optionalString(fieldName: string) {
  return v.optional(v.string(`Expected a string for ${fieldName}`));
}

/** Schema for a webhook field mapping ({ name, source? }). */
const WebhookFieldSchema = v.object({
  name: nonEmptyString("field name"),
  source: optionalString("field source"),
});

/** Schema for a conditional webhook rule ({ field, operator, value }). */
const WebhookRuleSchema = v.object({
  field: nonEmptyString("rule field"),
  operator: nonEmptyString("rule operator"),
  value: v.string("Expected a string for rule value"),
});

/** Schema for a custom HTTP header ({ name, value }). */
const WebhookHeaderSchema = v.object({
  name: nonEmptyString("header name"),
  value: nonEmptyString("header value"),
});

/** Schema for Developer Console OAuth credentials. */
const DeveloperConsoleOAuthSchema = v.object({
  client_id: nonEmptyString("client_id"),
  client_secret: nonEmptyString("client_secret"),
  org_id: nonEmptyString("org_id"),
  environment: optionalString("environment"),
});

/**
 * Schema for the webhook payload sent to POST /webhooks/subscribe.
 * Matches the `webhook` property of the request body.
 * Required fields per the Commerce API: webhook_method, webhook_type, batch_name, hook_name, url.
 */
export const WebhookSubscribeParamsSchema = v.object({
  webhook_method: nonEmptyString("webhook_method"),
  webhook_type: nonEmptyString("webhook_type"),
  batch_name: nonEmptyString("batch_name"),
  batch_order: v.optional(v.number()),
  hook_name: nonEmptyString("hook_name"),
  url: nonEmptyString("url"),
  priority: v.optional(v.number()),
  required: v.optional(v.boolean()),
  soft_timeout: v.optional(v.number()),
  timeout: v.optional(v.number()),
  method: optionalString("method"),
  fallback_error_message: optionalString("fallback_error_message"),
  ttl: v.optional(v.number()),
  fields: v.optional(
    v.array(WebhookFieldSchema, "Expected an array of field objects"),
  ),
  rules: v.optional(
    v.array(WebhookRuleSchema, "Expected an array of rule objects"),
  ),
  headers: v.optional(
    v.array(WebhookHeaderSchema, "Expected an array of header objects"),
  ),
  developer_console_oauth: v.optional(DeveloperConsoleOAuthSchema),
});

/**
 * Schema for the parameters sent to POST /webhooks/unsubscribe.
 * Required: webhook_method, webhook_type, batch_name, hook_name.
 */
export const WebhookUnsubscribeParamsSchema = v.object({
  webhook_method: nonEmptyString("webhook_method"),
  webhook_type: nonEmptyString("webhook_type"),
  batch_name: nonEmptyString("batch_name"),
  hook_name: nonEmptyString("hook_name"),
});

/**
 * The parameters for POST /webhooks/subscribe.
 * @see https://developer.adobe.com/commerce/extensibility/webhooks/api/#subscribe-a-webhook
 */
export type WebhookSubscribeParams = v.InferInput<
  typeof WebhookSubscribeParamsSchema
>;

/**
 * The parameters for POST /webhooks/unsubscribe.
 * @see https://developer.adobe.com/commerce/extensibility/webhooks/api/#unsubscribe-a-webhook
 */
export type WebhookUnsubscribeParams = v.InferInput<
  typeof WebhookUnsubscribeParamsSchema
>;
