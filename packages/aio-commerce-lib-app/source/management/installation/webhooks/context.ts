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

import { resolveCommerceHttpClientParams } from "@adobe/aio-commerce-lib-api";
import {
  createCustomCommerceWebhooksApiClient,
  getWebhookList,
  subscribeWebhook,
} from "@adobe/aio-commerce-lib-webhooks/api";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type {
  ExecutionContext,
  InstallationContext,
} from "#management/installation/workflow/index";

/**
 * Create a custom Commerce Webhooks API Client with only the operations needed for installation.
 * @param params - The runtime action params to resolve the client params from.
 */
function createCommerceWebhooksApiClient(params: RuntimeActionParams) {
  const commerceClientParams = resolveCommerceHttpClientParams(params, {
    tryForwardAuthProvider: true,
  });

  commerceClientParams.fetchOptions ??= {};
  commerceClientParams.fetchOptions.timeout = 1000 * 60 * 2; // 2 minutes

  return createCustomCommerceWebhooksApiClient(commerceClientParams, {
    getWebhookList,
    subscribeWebhook,
  });
}

/** A Commerce Webhooks API client scoped to the operations used during installation. */
export type CustomCommerceWebhooksApiClient = ReturnType<
  typeof createCommerceWebhooksApiClient
>;

/** Creates the webhooks step context with a lazy-initialized API client. */
export function createWebhooksStepContext(installation: InstallationContext) {
  const { params } = installation;

  let commerceWebhooksClient: CustomCommerceWebhooksApiClient | null = null;

  return {
    get commerceWebhooksClient() {
      if (commerceWebhooksClient === null) {
        commerceWebhooksClient = createCommerceWebhooksApiClient(params);
      }

      return commerceWebhooksClient;
    },
  };
}

/** Context available to webhook steps (inherited from webhooks branch). */
export type WebhooksStepContext = ReturnType<typeof createWebhooksStepContext>;

/** The execution context for webhook leaf steps. */
export type WebhooksExecutionContext = ExecutionContext<WebhooksStepContext>;
