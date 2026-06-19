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
  createRegistration,
  deleteRegistration,
  getAllRegistrations,
} from "@adobe/aio-commerce-lib-events/io-events";

import { IoEventsOutputs } from "./outputs";

import type { AdobeIoEventsHttpClient } from "@adobe/aio-commerce-lib-api";
import type { IoEventRegistration } from "@adobe/aio-commerce-lib-events/io-events";
import type {
  DiffResult,
  Resource,
  UpstreamOutputs,
} from "@aio-commerce-sdk/iacly";
import type { LibIaclyConfig } from "../../index";
import type { IoEventsOrgContext, IoEventsRegistrationConfig } from "./types";

export class IoEventsRegistrationResource
  implements
    Resource<LibIaclyConfig, IoEventsRegistrationConfig, IoEventRegistration>
{
  public readonly kind = "io-events/registration";
  public readonly dependsOn: readonly string[] = ["io-events/event-metadata"];

  readonly #client: AdobeIoEventsHttpClient;
  readonly #org: IoEventsOrgContext;

  public constructor(client: AdobeIoEventsHttpClient, org: IoEventsOrgContext) {
    this.#client = client;
    this.#org = org;
  }

  public check(
    config: LibIaclyConfig,
  ): Promise<readonly IoEventsRegistrationConfig[]> {
    return Promise.resolve(config.ioEvents?.registrations ?? []);
  }

  public keyFromDesired(desired: IoEventsRegistrationConfig): string {
    return desired.name;
  }

  public keyFromState(state: IoEventRegistration): string {
    return state.name;
  }

  public async list(): Promise<IoEventRegistration[]> {
    const response = await getAllRegistrations(this.#client, {
      consumerOrgId: this.#org.consumerOrgId,
      projectId: this.#org.projectId,
      workspaceId: this.#org.workspaceId,
    });
    return response._embedded?.registrations ?? [];
  }

  public diff(
    current: IoEventRegistration | null,
    desired: IoEventsRegistrationConfig,
  ): DiffResult<IoEventsRegistrationConfig, IoEventRegistration> {
    if (current === null) {
      return { kind: "create", desired };
    }
    const changed =
      current.name !== desired.name ||
      current.delivery_type !== desired.deliveryType ||
      current.webhook_url !== desired.webhookUrl;
    return changed ? { kind: "replace", current, desired } : { kind: "noop" };
  }

  public async create(
    desired: IoEventsRegistrationConfig,
    upstream: UpstreamOutputs,
  ): Promise<IoEventRegistration> {
    const { providerId } = IoEventsOutputs.provider(
      upstream,
      desired.providerInstanceId,
    );
    return await createRegistration(this.#client, {
      consumerOrgId: this.#org.consumerOrgId,
      projectId: this.#org.projectId,
      workspaceId: this.#org.workspaceId,
      clientId: desired.clientId,
      name: desired.name,
      description: desired.description,
      deliveryType: desired.deliveryType,
      webhookUrl: desired.webhookUrl,
      eventsOfInterest: desired.eventCodes.map((eventCode) => ({
        providerId,
        eventCode,
      })),
    });
  }

  public async delete(
    _id: string,
    current: IoEventRegistration,
  ): Promise<void> {
    await deleteRegistration(this.#client, {
      consumerOrgId: this.#org.consumerOrgId,
      projectId: this.#org.projectId,
      workspaceId: this.#org.workspaceId,
      registrationId: current.registration_id,
    });
  }
}
