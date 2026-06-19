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

import { updateEventingConfiguration } from "@adobe/aio-commerce-lib-events/commerce";

import type { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
import type {
  DiffResult,
  Resource,
  UpstreamOutputs,
} from "@aio-commerce-sdk/iacly";
import type { LibIaclyConfig } from "../../index";
import type { CommerceEventingSetupConfig } from "./types";

/** Sentinel type for the "state" of setup — it has no meaningful state to store. */
type SetupState = { readonly applied: true };

export class CommerceEventingSetupResource
  implements Resource<LibIaclyConfig, CommerceEventingSetupConfig, SetupState>
{
  public readonly kind = "commerce-events/setup";
  public readonly dependsOn: readonly string[] = [];

  readonly #client: AdobeCommerceHttpClient;

  public constructor(client: AdobeCommerceHttpClient) {
    this.#client = client;
  }

  public check(
    config: LibIaclyConfig,
  ): Promise<readonly CommerceEventingSetupConfig[]> {
    return Promise.resolve(
      config.commerceEvents ? [config.commerceEvents.setup] : [],
    );
  }

  public keyFromDesired(desired: CommerceEventingSetupConfig): string {
    return desired.instanceId;
  }

  public keyFromState(_state: SetupState): string {
    // Single-instance resource; key is always the same sentinel.
    return "setup";
  }

  public diff(
    _current: SetupState | null,
    desired: CommerceEventingSetupConfig,
  ): DiffResult<CommerceEventingSetupConfig, SetupState> {
    // Always upsert — there's no read API to compare against.
    return { kind: "create", desired };
  }

  public async create(
    desired: CommerceEventingSetupConfig,
    _upstream: UpstreamOutputs,
  ): Promise<SetupState> {
    await updateEventingConfiguration(this.#client, {
      enabled: true,
      instance_id: desired.instanceId,
      merchant_id: desired.merchantId,
      environment_id: desired.environmentId,
    });
    return { applied: true };
  }

  public delete(_id: string, _current: SetupState): Promise<void> {
    // Intentionally a no-op: disabling Commerce eventing on uninstall would break any
    // other app that relies on it. The caller must explicitly manage this if needed.
    return Promise.resolve();
  }
}
