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
  getWebhookList,
  subscribeWebhook,
  unsubscribeWebhook,
} from "@adobe/aio-commerce-lib-webhooks/api";

import type { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
import type { CommerceWebhook } from "@adobe/aio-commerce-lib-webhooks/api";
import type {
  DiffResult,
  Resource,
  UpstreamOutputs,
} from "@aio-commerce-sdk/iacly";
import type { LibIaclyConfig } from "../index";
import type { WebhookConfig } from "./types";

export class WebhookResource
  implements Resource<LibIaclyConfig, WebhookConfig, CommerceWebhook>
{
  public readonly kind = "webhooks/webhook";
  public readonly dependsOn: readonly string[] = [];

  readonly #client: AdobeCommerceHttpClient;

  public constructor(client: AdobeCommerceHttpClient) {
    this.#client = client;
  }

  public check(config: LibIaclyConfig): Promise<readonly WebhookConfig[]> {
    return Promise.resolve(config.webhooks ?? []);
  }

  public keyFromDesired(desired: WebhookConfig): string {
    return `${desired.webhook_method}:${desired.batch_name}:${desired.hook_name}`;
  }

  public keyFromState(state: CommerceWebhook): string {
    return `${state.webhook_method}:${state.batch_name}:${state.hook_name}`;
  }

  public list(): Promise<CommerceWebhook[]> {
    return getWebhookList(this.#client);
  }

  public diff(
    current: CommerceWebhook | null,
    desired: WebhookConfig,
  ): DiffResult<WebhookConfig, CommerceWebhook> {
    if (current === null) {
      return { kind: "create", desired };
    }

    const changed =
      current.url !== desired.url ||
      current.required !== desired.required ||
      current.priority !== desired.priority ||
      JSON.stringify(current.fields) !== JSON.stringify(desired.fields) ||
      JSON.stringify(current.rules) !== JSON.stringify(desired.rules) ||
      JSON.stringify(current.headers) !== JSON.stringify(desired.headers);

    return changed ? { kind: "replace", current, desired } : { kind: "noop" };
  }

  public async create(
    desired: WebhookConfig,
    _upstream: UpstreamOutputs,
  ): Promise<CommerceWebhook> {
    // Cast needed: WebhookConfig uses readonly arrays; WebhookSubscribeParams uses mutable arrays.
    await subscribeWebhook(
      this.#client,
      desired as Parameters<typeof subscribeWebhook>[1],
    );
    // subscribeWebhook returns void — reconstruct state from desired fields.
    return desired as unknown as CommerceWebhook;
  }

  public async delete(_id: string, current: CommerceWebhook): Promise<void> {
    await unsubscribeWebhook(this.#client, {
      webhook_method: current.webhook_method,
      webhook_type: current.webhook_type,
      batch_name: current.batch_name,
      hook_name: current.hook_name,
    });
  }
}
