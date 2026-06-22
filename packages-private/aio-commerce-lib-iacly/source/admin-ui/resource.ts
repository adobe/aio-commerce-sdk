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
  registerExtension,
  unregisterExtension,
} from "@adobe/aio-commerce-lib-admin-ui/api";

import type { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
import type {
  DiffResult,
  Resource,
  UpstreamOutputs,
} from "@aio-commerce-sdk/iacly";
import type { LibIaclyConfig } from "../index";
import type { AdminUiExtensionConfig, AdminUiExtensionState } from "./types";

export class AdminUiResource
  implements
    Resource<LibIaclyConfig, AdminUiExtensionConfig, AdminUiExtensionState>
{
  public readonly kind = "admin-ui/extension";
  public readonly dependsOn: readonly string[] = [];

  readonly #client: AdobeCommerceHttpClient;

  public constructor(client: AdobeCommerceHttpClient) {
    this.#client = client;
  }

  public check(
    config: LibIaclyConfig,
  ): Promise<readonly AdminUiExtensionConfig[]> {
    return Promise.resolve(config.adminUi?.extensions ?? []);
  }

  public keyFromDesired(desired: AdminUiExtensionConfig): string {
    return `${desired.extensionName}:${desired.extensionWorkspace}`;
  }

  public keyFromState(state: AdminUiExtensionState): string {
    return `${state.extensionName}:${state.extensionWorkspace}`;
  }

  // No list() — Admin UI has no list endpoint; engine uses snapshot-only mode.

  public diff(
    current: AdminUiExtensionState | null,
    desired: AdminUiExtensionConfig,
  ): DiffResult<AdminUiExtensionConfig, AdminUiExtensionState> {
    if (current === null) {
      return { kind: "create", desired };
    }
    const changed =
      current.extensionUrl !== desired.extensionUrl ||
      current.extensionTitle !== desired.extensionTitle;
    return changed ? { kind: "replace", current, desired } : { kind: "noop" };
  }

  public async create(
    desired: AdminUiExtensionConfig,
    _upstream: UpstreamOutputs,
  ): Promise<AdminUiExtensionState> {
    const response = await registerExtension(this.#client, {
      extensionName: desired.extensionName,
      extensionTitle: desired.extensionTitle,
      extensionUrl: desired.extensionUrl,
      extensionWorkspace: desired.extensionWorkspace,
    });
    return {
      ...response,
      extensionName: desired.extensionName,
      extensionWorkspace: desired.extensionWorkspace,
      extensionUrl: desired.extensionUrl,
      extensionTitle: desired.extensionTitle,
    };
  }

  public async delete(
    _id: string,
    current: AdminUiExtensionState,
  ): Promise<void> {
    await unregisterExtension(this.#client, {
      extensionName: current.extensionName,
      workspaceName: current.extensionWorkspace,
    });
  }
}
