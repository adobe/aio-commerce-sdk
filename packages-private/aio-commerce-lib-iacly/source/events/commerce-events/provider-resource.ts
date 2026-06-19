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
  createEventProvider,
  deleteEventProvider,
  getAllEventProviders,
} from "@adobe/aio-commerce-lib-events/commerce";

import { IoEventsOutputs } from "../io-events/outputs";

import type { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
import type { CommerceEventProvider } from "@adobe/aio-commerce-lib-events/commerce";
import type {
  DiffResult,
  Resource,
  UpstreamOutputs,
} from "@aio-commerce-sdk/iacly";
import type { LibIaclyConfig } from "../../index";
import type { CommerceEventProviderConfig } from "./types";

export class CommerceEventsProviderResource
  implements
    Resource<LibIaclyConfig, CommerceEventProviderConfig, CommerceEventProvider>
{
  public readonly kind = "commerce-events/provider";
  public readonly dependsOn: readonly string[] = [
    "io-events/provider",
    "commerce-events/setup",
  ];

  readonly #client: AdobeCommerceHttpClient;

  public constructor(client: AdobeCommerceHttpClient) {
    this.#client = client;
  }

  public check(
    config: LibIaclyConfig,
  ): Promise<readonly CommerceEventProviderConfig[]> {
    return Promise.resolve(config.commerceEvents?.providers ?? []);
  }

  public keyFromDesired(desired: CommerceEventProviderConfig): string {
    return desired.ioEventsProviderInstanceId;
  }

  public keyFromState(state: CommerceEventProvider): string {
    return state.instance_id ?? state.provider_id;
  }

  public list(): Promise<CommerceEventProvider[]> {
    return getAllEventProviders(this.#client);
  }

  public diff(
    current: CommerceEventProvider | null,
    desired: CommerceEventProviderConfig,
  ): DiffResult<CommerceEventProviderConfig, CommerceEventProvider> {
    if (current === null) {
      return { kind: "create", desired };
    }
    const changed =
      (current.label ?? undefined) !== desired.label ||
      (current.description ?? undefined) !== desired.description;
    return changed ? { kind: "replace", current, desired } : { kind: "noop" };
  }

  public create(
    desired: CommerceEventProviderConfig,
    upstream: UpstreamOutputs,
  ): Promise<CommerceEventProvider> {
    const { providerId } = IoEventsOutputs.provider(
      upstream,
      desired.ioEventsProviderInstanceId,
    );
    return createEventProvider(this.#client, {
      provider_id: providerId,
      instance_id: desired.ioEventsProviderInstanceId,
      label: desired.label,
      description: desired.description,
    });
  }

  public async delete(
    _id: string,
    current: CommerceEventProvider,
  ): Promise<void> {
    await deleteEventProvider(this.#client, {
      provider_id: current.provider_id,
    });
  }
}
