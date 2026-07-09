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
  environment: optionalString("environment"),
  org_id: nonEmptyString("org_id"),
});

/**
 * Schema for the webhook payload sent to POST /webhooks/subscribe.
 * Matches the `webhook` property of the request body.
 * Required fields per the Commerce API: webhook_method, webhook_type, batch_name, hook_name, url.
 */
export const WebhookSubscribeParamsSchema = v.object({
  batch_name: nonEmptyString("batch_name"),
  batch_order: v.optional(v.number()),
  developer_console_oauth: v.optional(DeveloperConsoleOAuthSchema),
  fallback_error_message: optionalString("fallback_error_message"),
  fields: v.optional(
    v.array(WebhookFieldSchema, "Expected an array of field objects"),
  ),
  headers: v.optional(
    v.array(WebhookHeaderSchema, "Expected an array of header objects"),
  ),
  hook_name: nonEmptyString("hook_name"),
  method: optionalString("method"),
  priority: v.optional(v.number()),
  required: v.optional(v.boolean()),
  rules: v.optional(
    v.array(WebhookRuleSchema, "Expected an array of rule objects"),
  ),
  soft_timeout: v.optional(v.number()),
  timeout: v.optional(v.number()),
  ttl: v.optional(v.number()),
  url: nonEmptyString("url"),
  webhook_method: nonEmptyString("webhook_method"),
  webhook_type: nonEmptyString("webhook_type"),
});

/**
 * Schema for the parameters sent to POST /webhooks/unsubscribe.
 * Required: webhook_method, webhook_type, batch_name, hook_name.
 */
export const WebhookUnsubscribeParamsSchema = v.object({
  batch_name: nonEmptyString("batch_name"),
  hook_name: nonEmptyString("hook_name"),
  webhook_method: nonEmptyString("webhook_method"),
  webhook_type: nonEmptyString("webhook_type"),
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
