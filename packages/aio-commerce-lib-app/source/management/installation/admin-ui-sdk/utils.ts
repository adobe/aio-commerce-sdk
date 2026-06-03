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

import { createAdminUiApiClient } from "@adobe/aio-commerce-lib-admin-ui/api";
import { resolveCommerceHttpClientParams } from "@adobe/aio-commerce-lib-api";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  ExecutionContext,
  InstallationContext,
  StepContextFactory,
} from "#management/installation/workflow/step";

/** Config type when Admin UI configuration is present. */
export type AdminUiConfig = CommerceAppConfigOutputModel & {
  adminUi: NonNullable<CommerceAppConfigOutputModel["adminUi"]>;
};

function createAdminUiClient(params: RuntimeActionParams) {
  const commerceClientParams = resolveCommerceHttpClientParams(params, {
    tryForwardAuthProvider: true,
  });

  return createAdminUiApiClient(commerceClientParams);
}

/** The Admin UI SDK API client used during installation. */
export type AdminUiApiClient = ReturnType<typeof createAdminUiClient>;

/** Context shared across Admin UI SDK installation steps. */
export interface AdminUiSdkStepContext extends Record<string, unknown> {
  get adminUiClient(): AdminUiApiClient;
}

/** The execution context for Admin UI SDK leaf steps. */
export type AdminUiSdkExecutionContext =
  ExecutionContext<AdminUiSdkStepContext>;

/** Creates the Admin UI SDK step context with a lazy-initialized API client. */
export const createAdminUiSdkStepContext: StepContextFactory<
  AdminUiSdkStepContext
> = (installation: InstallationContext) => {
  const { params } = installation;
  let adminUiClient: AdminUiApiClient | null = null;

  return {
    get adminUiClient() {
      if (adminUiClient === null) {
        adminUiClient = createAdminUiClient(params);
      }

      return adminUiClient;
    },
  };
};
