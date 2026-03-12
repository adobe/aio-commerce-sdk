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

/** A field mapping in a Commerce webhook subscription. */
export type CommerceWebhookField = {
  name: string;
  source?: string;
};

/** A conditional rule in a Commerce webhook subscription. */
export type CommerceWebhookRule = {
  field: string;
  operator: string;
  value: string;
};

/** A custom HTTP header in a Commerce webhook subscription. */
export type CommerceWebhookHeader = {
  name: string;
  value: string;
};

/** Developer Console OAuth credentials attached to a webhook. */
export type CommerceWebhookDeveloperConsoleOAuth = {
  client_id: string;
  client_secret: string;
  org_id: string;
  environment?: string;
};

/** A single Commerce webhook subscription as returned by GET /webhooks/list. */
export type CommerceWebhook = {
  webhook_method: string;
  webhook_type: string;
  batch_name: string;
  batch_order?: number;
  hook_name: string;
  url: string;
  priority?: number;
  required?: boolean;
  soft_timeout?: number;
  timeout?: number;
  method?: string;
  fallback_error_message?: string;
  ttl?: number;
  fields?: CommerceWebhookField[];
  rules?: CommerceWebhookRule[];
  headers?: CommerceWebhookHeader[];
  developer_console_oauth?: CommerceWebhookDeveloperConsoleOAuth;
};

/** The response type for GET /webhooks/list. */
export type CommerceWebhookManyResponse = CommerceWebhook[];

/** A single entry from GET /webhooks/supportedList (SaaS only). */
export type CommerceSupportedWebhook = {
  name: string;
};

/** The response type for GET /webhooks/supportedList. */
export type CommerceSupportedWebhookManyResponse = CommerceSupportedWebhook[];
