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
  byScopeId,
  getConfiguration,
  initialize,
  setConfiguration,
} from "@adobe/aio-commerce-lib-config";
import { ok } from "@adobe/aio-commerce-lib-core/responses";
import {
  HttpActionRouter,
  logger,
} from "@aio-commerce-sdk/common-utils/actions";
import { nonEmptyStringValueSchema } from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

import { validateCommerceAppConfigDomain } from "#config/index";

import type { BusinessConfigSchema } from "@adobe/aio-commerce-lib-config";
import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type { BaseContext } from "@aio-commerce-sdk/common-utils/actions";

/** The arguments for the config action factory. */
type ConfigActionFactoryArgs = {
  configSchema: BusinessConfigSchema;
};

/** The parameters for the config action. */
type ConfigActionParams = RuntimeActionParams &
  ConfigActionFactoryArgs & {
    AIO_COMMERCE_CONFIG_ENCRYPTION_KEY?: string;
  };

/** The context for the config action. */
interface ConfigActionContext extends BaseContext {
  rawParams: ConfigActionParams;
}

// The router that will hold the config routes
const router = new HttpActionRouter<ConfigActionContext>().use(logger());

/** GET / - Retrieve configuration */
router.get("/", {
  query: v.object({
    scopeId: nonEmptyStringValueSchema("scopeId"),
  }),

  handler: async (req, ctx) => {
    const { logger, rawParams } = ctx;
    const configSchema = rawParams.configSchema;

    logger.debug("Validating configuration schema...");
    const validatedSchema = validateCommerceAppConfigDomain(
      configSchema,
      "businessConfig.schema",
    );

    initialize({ schema: validatedSchema });

    const { scopeId } = req.query;
    logger.debug(`Retrieving configuration with scope id: ${scopeId}`);
    const appConfiguration = await getConfiguration(byScopeId(scopeId), {
      encryptionKey: rawParams.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY,
    });

    logger.debug("Masking password values...");
    appConfiguration.config = appConfiguration.config.map((item) => {
      const schemaMatch = rawParams.configSchema.find(
        (field) => field.name === item.name,
      );

      if (schemaMatch?.type === "password") {
        return {
          ...item,
          value: "*****",
        };
      }

      return item;
    });

    return ok({
      body: { schema: validatedSchema, values: appConfiguration },
    });
  },
});

/** POST / - Set configuration */
router.post("/", {
  body: v.object({
    scopeId: nonEmptyStringValueSchema("scopeId"),
    config: v.array(
      v.object({
        name: nonEmptyStringValueSchema("config.name"),
        value: v.union([v.string(), v.array(v.string())]),
      }),
    ),
  }),

  handler: async (req, ctx) => {
    const { logger, rawParams } = ctx;
    const { configSchema } = rawParams;

    logger.debug(`Setting configuration with scope id: ${req.body.scopeId}`);
    const { scopeId, config } = req.body;

    const result = await setConfiguration({ config }, byScopeId(scopeId), {
      encryptionKey: rawParams.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY,
    });

    result.config = result.config.map((item) => {
      const schemaMatch = configSchema.find(
        (field) => field.name === item.name,
      );

      if (schemaMatch?.type === "password") {
        return { ...item, value: "*****" };
      }

      return item;
    });

    return ok({
      body: result,
      headers: { "Cache-Control": "no-store" },
    });
  },
});

/** Factory to create the route handler for the `config` action. */
export const configRuntimeAction =
  ({ configSchema }: ConfigActionFactoryArgs) =>
  async (params: RuntimeActionParams) => {
    const handler = router.handler();
    return await handler({
      ...params,
      configSchema,
    });
  };
