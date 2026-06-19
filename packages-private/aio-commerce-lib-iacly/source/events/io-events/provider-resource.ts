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
} from "@adobe/aio-commerce-lib-events/io-events";

import type { AdobeIoEventsHttpClient } from "@adobe/aio-commerce-lib-api";
import type { IoEventProvider } from "@adobe/aio-commerce-lib-events/io-events";
import type {
  DiffResult,
  ProviderOutputs,
  Resource,
  UpstreamOutputs,
} from "@aio-commerce-sdk/iacly";
import type { LibIaclyConfig } from "../../index";
import type { IoEventsOrgContext, IoEventsProviderConfig } from "./types";

export class IoEventsProviderResource
  implements Resource<LibIaclyConfig, IoEventsProviderConfig, IoEventProvider>
{
  public readonly kind = "io-events/provider";
  public readonly dependsOn: readonly string[] = [];

  readonly #client: AdobeIoEventsHttpClient;
  readonly #org: IoEventsOrgContext;

  public constructor(client: AdobeIoEventsHttpClient, org: IoEventsOrgContext) {
    this.#client = client;
    this.#org = org;
  }

  public check(
    config: LibIaclyConfig,
  ): Promise<readonly IoEventsProviderConfig[]> {
    return Promise.resolve(config.ioEvents?.providers ?? []);
  }

  public keyFromDesired(desired: IoEventsProviderConfig): string {
    return desired.instanceId;
  }

  public keyFromState(state: IoEventProvider): string {
    return state.instance_id;
  }

  public outputs(states: readonly IoEventProvider[]): ProviderOutputs {
    return Object.fromEntries(
      states.map((s) => [s.instance_id, { providerId: s.id }]),
    );
  }

  public async list(): Promise<IoEventProvider[]> {
    const response = await getAllEventProviders(this.#client, {
      consumerOrgId: this.#org.consumerOrgId,
    });
    return response._embedded?.providers ?? [];
  }

  public diff(
    current: IoEventProvider | null,
    desired: IoEventsProviderConfig,
  ): DiffResult<IoEventsProviderConfig, IoEventProvider> {
    if (current === null) {
      return { kind: "create", desired };
    }
    const changed =
      current.label !== desired.label ||
      (current.description ?? undefined) !== desired.description;
    return changed ? { kind: "replace", current, desired } : { kind: "noop" };
  }

  public create(
    desired: IoEventsProviderConfig,
    _upstream: UpstreamOutputs,
  ): Promise<IoEventProvider> {
    return createEventProvider(this.#client, {
      consumerOrgId: this.#org.consumerOrgId,
      projectId: this.#org.projectId,
      workspaceId: this.#org.workspaceId,
      label: desired.label,
      description: desired.description,
      instanceId: desired.instanceId,
      providerType: desired.providerType,
    });
  }

  public async delete(_id: string, current: IoEventProvider): Promise<void> {
    await deleteEventProvider(this.#client, {
      consumerOrgId: this.#org.consumerOrgId,
      projectId: this.#org.projectId,
      workspaceId: this.#org.workspaceId,
      providerId: current.id,
    });
  }
}
