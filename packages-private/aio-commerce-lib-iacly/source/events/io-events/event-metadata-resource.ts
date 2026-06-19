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
  createEventMetadataForProvider,
  deleteEventMetadataForProvider,
  getAllEventMetadataForProvider,
  getAllEventProviders,
} from "@adobe/aio-commerce-lib-events/io-events";

import { IoEventsOutputs } from "./outputs";

import type { AdobeIoEventsHttpClient } from "@adobe/aio-commerce-lib-api";
import type {
  DiffResult,
  Resource,
  UpstreamOutputs,
} from "@aio-commerce-sdk/iacly";
import type { LibIaclyConfig } from "../../index";
import type {
  IoEventsEventMetadataConfig,
  IoEventsEventMetadataState,
  IoEventsOrgContext,
} from "./types";

export class IoEventsEventMetadataResource
  implements
    Resource<
      LibIaclyConfig,
      IoEventsEventMetadataConfig,
      IoEventsEventMetadataState
    >
{
  public readonly kind = "io-events/event-metadata";
  public readonly dependsOn: readonly string[] = ["io-events/provider"];

  readonly #client: AdobeIoEventsHttpClient;
  readonly #org: IoEventsOrgContext;

  public constructor(client: AdobeIoEventsHttpClient, org: IoEventsOrgContext) {
    this.#client = client;
    this.#org = org;
  }

  public check(
    config: LibIaclyConfig,
  ): Promise<readonly IoEventsEventMetadataConfig[]> {
    return Promise.resolve(config.ioEvents?.eventMetadata ?? []);
  }

  public keyFromDesired(desired: IoEventsEventMetadataConfig): string {
    return `${desired.providerInstanceId}:${desired.event_code}`;
  }

  public keyFromState(state: IoEventsEventMetadataState): string {
    return `${state.providerInstanceId}:${state.event_code}`;
  }

  public async list(): Promise<IoEventsEventMetadataState[]> {
    const providersResponse = await getAllEventProviders(this.#client, {
      consumerOrgId: this.#org.consumerOrgId,
    });
    const providers = providersResponse._embedded?.providers ?? [];

    const allMetadata = await Promise.all(
      providers.map(async (p) => {
        const metaResponse = await getAllEventMetadataForProvider(
          this.#client,
          {
            providerId: p.id,
          },
        );
        // _embedded is IoEventMetadataHalModel[] (a flat array)
        const items = metaResponse._embedded ?? [];
        return items.map(
          (m): IoEventsEventMetadataState => ({
            providerInstanceId: p.instance_id,
            apiProviderId: p.id,
            event_code: m.event_code,
            label: m.label,
            description: m.description,
          }),
        );
      }),
    );
    return allMetadata.flat();
  }

  public diff(
    current: IoEventsEventMetadataState | null,
    desired: IoEventsEventMetadataConfig,
  ): DiffResult<IoEventsEventMetadataConfig, IoEventsEventMetadataState> {
    if (current === null) {
      return { kind: "create", desired };
    }
    const changed =
      current.label !== desired.label ||
      (current.description ?? undefined) !== desired.description;
    return changed ? { kind: "replace", current, desired } : { kind: "noop" };
  }

  public async create(
    desired: IoEventsEventMetadataConfig,
    upstream: UpstreamOutputs,
  ): Promise<IoEventsEventMetadataState> {
    const { providerId } = IoEventsOutputs.provider(
      upstream,
      desired.providerInstanceId,
    );
    const response = await createEventMetadataForProvider(this.#client, {
      consumerOrgId: this.#org.consumerOrgId,
      projectId: this.#org.projectId,
      workspaceId: this.#org.workspaceId,
      providerId,
      label: desired.label,
      description: desired.description,
      eventCode: desired.event_code,
    });
    return {
      providerInstanceId: desired.providerInstanceId,
      apiProviderId: providerId,
      event_code: response.event_code,
      label: response.label,
      description: response.description,
    };
  }

  public async delete(
    _id: string,
    current: IoEventsEventMetadataState,
  ): Promise<void> {
    await deleteEventMetadataForProvider(this.#client, {
      consumerOrgId: this.#org.consumerOrgId,
      projectId: this.#org.projectId,
      workspaceId: this.#org.workspaceId,
      providerId: current.apiProviderId,
      eventCode: current.event_code,
    });
  }
}
