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

import { badRequest, ok } from "@adobe/aio-commerce-lib-core/responses";
import {
  HttpActionRouter,
  logger,
} from "@aio-commerce-sdk/common-utils/actions";
import { inspect } from "@aio-commerce-sdk/common-utils/logging";
import * as v from "valibot";

import {
  getConfigSchema,
  getConfiguration,
  setConfiguration,
} from "../config-manager";
import { byCode, byCodeAndLevel, byScopeId } from "../config-utils";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type { BaseContext } from "@aio-commerce-sdk/common-utils/actions";
import type { SelectorBy } from "../config-utils";
import type { SetConfigurationRequest } from "../types";

export interface ConfigContext extends BaseContext {
  rawParams: RuntimeActionParams & {
    AIO_COMMERCE_CONFIG_ENCRYPTION_KEY?: string;
  };
}

// The router that will hold the config routes
export const router = new HttpActionRouter<ConfigContext>().use(logger());

/** GET / - Retrieve configuration */
router.get("/", {
  query: v.object({
    id: v.optional(v.string()),
    code: v.optional(v.string()),
    level: v.optional(v.string()),
  }),

  handler: async (req, ctx) => {
    const { id, code, level } = req.query;
    const { logger, rawParams } = ctx;

    if (!(id || code)) {
      const message = "Either id or code query param is required";

      logger.warn(`Invalid params: ${message}`);
      return badRequest(message);
    }

    let selector: SelectorBy;

    if (id) {
      selector = byScopeId(id);
      logger.debug(`Retrieving configuration by id: ${id}`);
    } else if (level) {
      selector = byCodeAndLevel(code as string, level);
      logger.debug(
        `Retrieving configuration by code: ${code}, level: ${level}`,
      );
    } else {
      selector = byCode(code as string);
      logger.debug(`Retrieving configuration by code: ${code}`);
    }

    const appConfiguration = await getConfiguration(selector, {
      encryptionKey: rawParams.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY ?? null,
    });

    return ok({ body: appConfiguration });
  },
});

/** POST / - Set configuration */
router.post("/", {
  body: v.object({
    config: v.array(
      v.object({
        name: v.string(),
        value: v.union([v.string(), v.array(v.string())]),
      }),
    ),
  }),

  handler: async (req, ctx) => {
    const { id, code, level } = req.query;
    const { logger, rawParams } = ctx;

    if (!(id || (code && level))) {
      const message =
        "Either id or both code and level query params are required";

      logger.warn(`Invalid params: ${message}`);
      return badRequest(message);
    }

    const payload = {
      config: req.body.config,
    } satisfies SetConfigurationRequest;

    const selector = id
      ? byScopeId(id)
      : byCodeAndLevel(code as string, level as string);

    const result = await setConfiguration(payload, selector, {
      encryptionKey: rawParams.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY ?? null,
    });

    return ok({
      body: { result },
      headers: { "Cache-Control": "no-store" },
    });
  },
});

/** GET /schema - Retrieve configuration schema */
router.get("/schema", {
  handler: async (_req, ctx) => {
    const { logger } = ctx;
    logger.debug("Retrieving configuration schema...");

    const configSchema = await getConfigSchema();
    logger.debug(
      `Successfully retrieved configSchema: ${inspect(configSchema)}`,
    );

    return ok({
      body: {
        configSchema,
      },
    });
  },
});

/** The handler method for the config action. */
export const configRuntimeAction = router.handler();
