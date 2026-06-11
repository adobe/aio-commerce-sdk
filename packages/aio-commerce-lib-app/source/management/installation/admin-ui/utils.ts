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
import type {
  ExecutionContext,
  InstallationContext,
  StepContextFactory,
} from "#management/installation/workflow/step";

export type { AdminUiConfig } from "#config/schema/admin-ui";

function createAdminUiClient(params: RuntimeActionParams) {
  const commerceClientParams = resolveCommerceHttpClientParams(params, {
    tryForwardAuthProvider: true,
  });

  return createAdminUiApiClient(commerceClientParams);
}

/** The Admin UI API client used during installation. */
export type AdminUiApiClient = ReturnType<typeof createAdminUiClient>;

/** Context shared across Admin UI installation steps. */
export interface AdminUiStepContext extends Record<string, unknown> {
  get adminUiClient(): AdminUiApiClient;
}

/** The execution context for Admin UI leaf steps. */
export type AdminUiExecutionContext = ExecutionContext<AdminUiStepContext>;

/** Creates the Admin UI step context with a lazy-initialized API client. */
export const createAdminUiStepContext: StepContextFactory<
  AdminUiStepContext
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
