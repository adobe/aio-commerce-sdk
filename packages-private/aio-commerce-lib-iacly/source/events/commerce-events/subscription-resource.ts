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
  createEventSubscription,
  deleteEventSubscription,
  getAllEventSubscriptions,
} from "@adobe/aio-commerce-lib-events/commerce";

import type { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
import type { CommerceEventSubscription } from "@adobe/aio-commerce-lib-events/commerce";
import type {
  DiffResult,
  Resource,
  UpstreamOutputs,
} from "@aio-commerce-sdk/iacly";
import type { LibIaclyConfig } from "../../index";
import type { CommerceEventSubscriptionConfig } from "./types";

export class CommerceEventSubscriptionResource
  implements
    Resource<
      LibIaclyConfig,
      CommerceEventSubscriptionConfig,
      CommerceEventSubscription
    >
{
  public readonly kind = "commerce-events/subscription";
  public readonly dependsOn: readonly string[] = ["commerce-events/provider"];

  readonly #client: AdobeCommerceHttpClient;

  public constructor(client: AdobeCommerceHttpClient) {
    this.#client = client;
  }

  public check(
    config: LibIaclyConfig,
  ): Promise<readonly CommerceEventSubscriptionConfig[]> {
    return Promise.resolve(config.commerceEvents?.subscriptions ?? []);
  }

  public keyFromDesired(desired: CommerceEventSubscriptionConfig): string {
    return desired.eventCode;
  }

  public keyFromState(state: CommerceEventSubscription): string {
    return state.name;
  }

  public list(): Promise<CommerceEventSubscription[]> {
    return getAllEventSubscriptions(this.#client);
  }

  public diff(
    current: CommerceEventSubscription | null,
    desired: CommerceEventSubscriptionConfig,
  ): DiffResult<CommerceEventSubscriptionConfig, CommerceEventSubscription> {
    if (current === null) {
      return { kind: "create", desired };
    }
    const desiredFields =
      desired.fields?.map((f) => ({ name: f.name, converter: f.value })) ?? [];
    const changed =
      JSON.stringify(current.fields ?? []) !== JSON.stringify(desiredFields);
    return changed ? { kind: "replace", current, desired } : { kind: "noop" };
  }

  public async create(
    desired: CommerceEventSubscriptionConfig,
    _upstream: UpstreamOutputs,
  ): Promise<CommerceEventSubscription> {
    const fields =
      desired.fields?.map((f) => ({ name: f.name, converter: f.value })) ?? [];
    await createEventSubscription(this.#client, {
      name: desired.eventCode,
      fields,
      provider_id: "default",
    });
    // createEventSubscription returns void — reconstruct state from desired.
    return {
      name: desired.eventCode,
      parent: "",
      provider_id: "default",
      fields,
      rules: [],
      destination: "default",
      priority: false,
      hipaa_audit_required: false,
    };
  }

  public async delete(
    _id: string,
    current: CommerceEventSubscription,
  ): Promise<void> {
    await deleteEventSubscription(this.#client, { name: current.name });
  }
}
