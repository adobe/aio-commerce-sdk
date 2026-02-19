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

import { ok } from "@adobe/aio-commerce-lib-core/responses";
import AioLogger from "@adobe/aio-lib-core-logging";

import { validateCommerceAppConfig } from "#config/index";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";

type RuntimeActionFactoryArgs = {
  appConfig: CommerceAppConfigOutputModel;
};

/** The route handler for the runtime action. */
export const appConfigRuntimeAction =
  ({ appConfig }: RuntimeActionFactoryArgs) =>
  async (params: RuntimeActionParams) => {
    const logger = AioLogger("get-app-config", {
      level: String(params.LOG_LEVEL) || "info",
    });

    const validatedConfig = validateCommerceAppConfig(appConfig);
    logger.debug("Successfully validated the app config");

    return ok({
      body: validatedConfig,
    });
  };
