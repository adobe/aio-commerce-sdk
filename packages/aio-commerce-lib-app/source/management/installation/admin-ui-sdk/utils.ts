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
  AdobeCommerceHttpClient,
  resolveCommerceHttpClientParams,
} from "@adobe/aio-commerce-lib-api";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  ExecutionContext,
  InstallationContext,
  StepContextFactory,
} from "#management/installation/workflow/step";

/** Config type when Admin UI SDK registration is configured. */
export type AdminUiSdkConfig = CommerceAppConfigOutputModel & {
  adminUiSdk: NonNullable<CommerceAppConfigOutputModel["adminUiSdk"]>;
};

/** Check if config has Admin UI SDK registration configuration. */
export function hasAdminUiSdk(
  config: CommerceAppConfigOutputModel,
): config is AdminUiSdkConfig {
  return config.adminUiSdk?.registration !== undefined;
}

/** Context shared across Admin UI SDK steps. */
export interface AdminUiSdkStepContext extends Record<string, unknown> {
  get commerceClient(): AdobeCommerceHttpClient;
}

/** The execution context for Admin UI SDK leaf steps. */
export type AdminUiSdkExecutionContext =
  ExecutionContext<AdminUiSdkStepContext>;

/** Creates the Admin UI SDK step context with a lazy-initialized Commerce HTTP client. */
export const createAdminUiSdkStepContext: StepContextFactory<
  AdminUiSdkStepContext
> = (installation: InstallationContext) => {
  const { params } = installation;
  let commerceClient: AdobeCommerceHttpClient | null = null;

  return {
    get commerceClient() {
      if (commerceClient === null) {
        const clientParams = resolveCommerceHttpClientParams(params);
        commerceClient = new AdobeCommerceHttpClient(clientParams);
      }

      return commerceClient;
    },
  };
};
