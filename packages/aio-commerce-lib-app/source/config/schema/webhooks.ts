/*
 * Copyright 2025 Adobe. All rights reserved.
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
  booleanValueSchema,
  nonEmptyStringValueSchema,
  positiveNumberValueSchema,
  stringValueSchema,
} from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

import type { CommerceAppConfigOutputModel } from "./app";

/** Schema for webhook field configuration (name and optional source). */
const WebhookFieldSchema = v.object({
  name: nonEmptyStringValueSchema("field name"),
  source: v.optional(stringValueSchema("field source")),
});

/** Schema for webhook rule configuration (field, operator, value). */
const WebhookRuleSchema = v.object({
  field: nonEmptyStringValueSchema("rule field"),
  operator: nonEmptyStringValueSchema("rule operator"),
  value: nonEmptyStringValueSchema("rule value"),
});

/** Schema for webhook header configuration (name, value). */
const WebhookHeaderSchema = v.object({
  name: nonEmptyStringValueSchema("header name"),
  value: nonEmptyStringValueSchema("header value"),
});

/** Schema for developer console OAuth configuration. */
const DeveloperConsoleOAuthSchema = v.object({
  client_id: nonEmptyStringValueSchema("client_id"),
  client_secret: nonEmptyStringValueSchema("client_secret"),
  org_id: nonEmptyStringValueSchema("org_id"),
  environment: nonEmptyStringValueSchema("environment"),
});

/** batch_name and hook_name must contain only letters, numbers, and underscores. */
const WEBHOOK_IDENTIFIER_REGEX = /^[a-zA-Z0-9_]+$/;

/** Response category for conflict detection: validation, append, or modification. */
const RESPONSE_CATEGORIES = ["validation", "append", "modification"] as const;
const ResponseCategorySchema = v.picklist(
  RESPONSE_CATEGORIES,
  `response_category must be one of: ${RESPONSE_CATEGORIES.join(", ")}`,
);

/** Schema for the nested webhook payload without url — used when runtimeAction resolves the URL at runtime. */
const WebhookDefinitionBaseSchema = v.object({
  webhook_method: nonEmptyStringValueSchema("webhook_method"),
  webhook_type: nonEmptyStringValueSchema("webhook_type"),
  batch_name: v.pipe(
    nonEmptyStringValueSchema("batch_name"),
    v.regex(
      WEBHOOK_IDENTIFIER_REGEX,
      "batch_name must contain only letters, numbers, and underscores",
    ),
  ),
  batch_order: v.optional(positiveNumberValueSchema("batch_order")),
  hook_name: v.pipe(
    nonEmptyStringValueSchema("hook_name"),
    v.regex(
      WEBHOOK_IDENTIFIER_REGEX,
      "hook_name must contain only letters, numbers, and underscores",
    ),
  ),
  priority: v.optional(positiveNumberValueSchema("priority")),
  required: v.optional(booleanValueSchema("required")),
  soft_timeout: v.optional(positiveNumberValueSchema("soft_timeout")),
  timeout: v.optional(positiveNumberValueSchema("timeout")),
  method: nonEmptyStringValueSchema("method"),
  fallback_error_message: v.optional(
    stringValueSchema("fallback_error_message"),
  ),
  ttl: v.optional(positiveNumberValueSchema("ttl")),
  fields: v.optional(
    v.array(WebhookFieldSchema, "Expected an array of webhook field objects"),
  ),
  rules: v.optional(
    v.array(WebhookRuleSchema, "Expected an array of webhook rule objects"),
  ),
  headers: v.optional(
    v.array(WebhookHeaderSchema, "Expected an array of webhook header objects"),
  ),
  developer_console_oauth: v.optional(DeveloperConsoleOAuthSchema),
  response_category: v.optional(ResponseCategorySchema),
});

/** Schema for the nested webhook payload with a required url. */
const WebhookDefinitionWithUrlSchema = v.object({
  ...WebhookDefinitionBaseSchema.entries,
  url: v.pipe(
    stringValueSchema("url"),
    v.url("The url field must be a valid URL"),
  ),
});

/** Schema for a webhook entry that resolves its URL from a runtime action. */
const WebhookEntryWithRuntimeActionSchema = v.object({
  description: nonEmptyStringValueSchema("description"),
  category: nonEmptyStringValueSchema("category"),
  runtimeAction: nonEmptyStringValueSchema("runtimeAction"),
  webhook: WebhookDefinitionBaseSchema,
});

/** Schema for a webhook entry that provides an explicit URL. */
const WebhookEntryWithUrlSchema = v.object({
  description: nonEmptyStringValueSchema("description"),
  category: nonEmptyStringValueSchema("category"),
  webhook: WebhookDefinitionWithUrlSchema,
});

/** Schema for a single webhook entry — either runtimeAction (no url) or explicit url (no runtimeAction). */
const WebhookEntrySchema = v.union([
  WebhookEntryWithRuntimeActionSchema,
  WebhookEntryWithUrlSchema,
]);

/** Schema for the optional webhooks array (when present, must have at least one item). */
export const WebhooksSchema = v.optional(
  v.pipe(
    v.array(WebhookEntrySchema, "Expected an array of webhook entries"),
    v.minLength(
      1,
      "webhooks array must contain at least one webhook when present",
    ),
  ),
);

/** Webhook field configuration */
export type WebhookField = v.InferInput<typeof WebhookFieldSchema>;

/** Webhook rule configuration */
export type WebhookRule = v.InferInput<typeof WebhookRuleSchema>;

/** Webhook header configuration */
export type WebhookHeader = v.InferInput<typeof WebhookHeaderSchema>;

/** Developer console OAuth configuration */
export type DeveloperConsoleOAuth = v.InferInput<
  typeof DeveloperConsoleOAuthSchema
>;

/** Nested webhook payload (webhook_method, fields, etc.) — union of base shape and url-carrying shape. */
export type WebhookDefinition =
  | v.InferInput<typeof WebhookDefinitionBaseSchema>
  | v.InferInput<typeof WebhookDefinitionWithUrlSchema>;

/** Single webhook entry — either runtimeAction-based or url-based (mutually exclusive at the type level). */
export type WebhookEntry = v.InferInput<typeof WebhookEntrySchema>;

/** Webhooks configuration (array of webhook entries). */
export type WebhooksConfiguration = v.InferInput<typeof WebhooksSchema>;

/** Config type when webhooks are present (non-empty array). */
export type WebhooksConfig = CommerceAppConfigOutputModel & {
  webhooks: NonNullable<CommerceAppConfigOutputModel["webhooks"]>;
};

/**
 * Check if config has webhooks (non-empty array).
 * @param config - The configuration to check.
 */
export function hasWebhooks(
  config: CommerceAppConfigOutputModel,
): config is WebhooksConfig {
  return Array.isArray(config?.webhooks) && config.webhooks.length > 0;
}
