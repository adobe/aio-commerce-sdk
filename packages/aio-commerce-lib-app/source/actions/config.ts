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
  byCode,
  byCodeAndLevel,
  byScopeId,
  getConfiguration,
  setConfiguration,
  setGlobalLibConfigOptions,
} from "@adobe/aio-commerce-lib-config/";
import { ok } from "@adobe/aio-commerce-lib-core/responses";
import {
  HttpActionRouter,
  logger,
} from "@aio-commerce-sdk/common-utils/actions";
import * as v from "valibot";

import { validateCommerceAppConfigDomain } from "#config/index";

import type {
  BusinessConfigSchema,
  SelectorBy,
} from "@adobe/aio-commerce-lib-config/";
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

const SelectorIdSchema = v.object({
  id: v.string(),
});

const SelectorCodeAndOptionalLevelSchema = v.object({
  code: v.string(),
  level: v.optional(v.string()),
});

/** Checks if the object is a selector by id. */
function isSelectorId(
  object: unknown,
): object is v.InferOutput<typeof SelectorIdSchema> {
  return (
    typeof object === "object" &&
    object !== null &&
    "id" in object &&
    typeof object.id === "string"
  );
}

// The router that will hold the config routes
const router = new HttpActionRouter<ConfigActionContext>().use(logger());

/** GET / - Retrieve configuration */
router.get("/", {
  query: v.union([SelectorIdSchema, SelectorCodeAndOptionalLevelSchema]),
  handler: async (req, ctx) => {
    const { logger, rawParams } = ctx;
    const query = req.query;

    if (rawParams.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY) {
      logger.debug("Setting encryption key...");
      setGlobalLibConfigOptions({
        encryptionKey: rawParams.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY,
      });
    }

    let selector: SelectorBy;

    if (isSelectorId(query)) {
      const id = query.id;
      selector = byScopeId(id);
      logger.debug(`Retrieving configuration by id: ${id}`);
    } else {
      const { code, level } = query;
      if (level) {
        selector = byCodeAndLevel(code, level);
        logger.debug(
          `Retrieving configuration by code: ${code}, level: ${level}`,
        );
      } else {
        selector = byCode(query.code);
        logger.debug(`Retrieving configuration by code: ${code}`);
      }
    }

    const appConfiguration = await getConfiguration(selector);

    // Make sure we reset the encryption key to null after the operation is complete.
    // Otherwise on warm invocations, the key may be kept in memory.
    if (rawParams.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY) {
      logger.debug("Resetting encryption key...");
      setGlobalLibConfigOptions({
        encryptionKey: null,
      });
    }

    return ok({ body: appConfiguration });
  },
});

/** POST / - Set configuration */
router.post("/", {
  body: v.object({
    selector: v.union([
      SelectorIdSchema,
      v.required(SelectorCodeAndOptionalLevelSchema),
    ]),

    config: v.array(
      v.object({
        name: v.string(),
        value: v.union([v.string(), v.array(v.string())]),
      }),
    ),
  }),

  handler: async (req, ctx) => {
    const { logger, rawParams } = ctx;

    if (rawParams.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY) {
      logger.debug("Setting encryption key...");
      setGlobalLibConfigOptions({
        encryptionKey: rawParams.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY,
      });
    }

    const { selector, config } = req.body;
    let selectorBy: SelectorBy;

    if (isSelectorId(selector)) {
      selectorBy = byScopeId(selector.id);
      logger.debug(`Setting configuration by id: ${selector.id}`);
    } else {
      selectorBy = byCodeAndLevel(selector.code, selector.level);
      logger.debug(
        `Setting configuration by code: ${selector.code}, level: ${selector.level}`,
      );
    }

    const result = await setConfiguration({ config }, selectorBy);

    // Make sure we reset the encryption key to null after the operation is complete.
    // Otherwise on warm invocations, the key may be kept in memory.
    if (rawParams.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY) {
      logger.debug("Resetting encryption key...");
      setGlobalLibConfigOptions({
        encryptionKey: null,
      });
    }

    return ok({
      body: { result },
      headers: { "Cache-Control": "no-store" },
    });
  },
});

/** GET /schema - Retrieve configuration schema */
router.get("/schema", {
  handler: (_req, { logger, rawParams }) => {
    logger.debug("Validating configuration schema...");

    const configSchema = rawParams.configSchema;
    const validatedSchema = validateCommerceAppConfigDomain(
      configSchema,
      "businessConfig.schema",
    );

    logger.debug("Successfully validated configuration schema");
    return ok({
      body: {
        configSchema: validatedSchema,
      },
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
