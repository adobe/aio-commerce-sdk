/*
 * Copyright 2025 Adobe. All rights reserved.
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
  defineRoute,
  logger,
  Router,
} from "@adobe/aio-commerce-lib-core/actions";
import { badRequest, ok } from "@adobe/aio-commerce-lib-core/responses";
import { inspect } from "@aio-commerce-sdk/common-utils/logging";
import * as v from "valibot";

import { getConfiguration, setConfiguration } from "../config-manager";
import { byCode, byCodeAndLevel, byScopeId } from "../config-utils";

import type { SelectorBy } from "../config-utils";
import type { SetConfigurationRequest } from "../types";

// The router that will hold the config routes
export const router = new Router().use(logger());

/** GET /config - Retrieve configuration */
const getConfigRoute = defineRoute(router, {
  query: v.object({
    id: v.optional(v.string()),
    code: v.optional(v.string()),
    level: v.optional(v.string()),
  }),

  handler: async (req, ctx) => {
    const { id, code, level } = req.query;
    const { logger } = ctx;

    logger.debug(
      `Retrieving configuration with params: ${inspect({ id, code, level })}`,
    );

    if (!(id || code)) {
      logger.warn("Invalid params: Either id or code query param is required");
      return badRequest({
        body: {
          code: "INVALID_PARAMS",
          message: "Either id or code query param is required",
        },
      });
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

    const appConfiguration = await getConfiguration(selector);
    logger.debug(
      `Successfully retrieved configuration: ${inspect(appConfiguration)}`,
    );

    return ok({ body: appConfiguration });
  },
});

/** POST /config - Set configuration */
const setConfigRoute = defineRoute(router, {
  body: v.object({
    config: v.array(
      v.object({
        name: v.string(),
        value: v.optional(v.union([v.string(), v.array(v.string())])),
      }),
    ),
  }),

  handler: async (req) => {
    const { id, code, level } = req.query;

    if (!(id || (code && level))) {
      return badRequest({
        body: {
          code: "INVALID_PARAMS",
          message: "Either id or both code and level query params are required",
        },
      });
    }

    const payload = { config: req.body.config } as SetConfigurationRequest;
    const selector = id
      ? byScopeId(id)
      : byCodeAndLevel(code as string, level as string);

    const result = await setConfiguration(payload, selector);

    return ok({
      body: { result },
      headers: { "Cache-Control": "no-store" },
    });
  },
});

/** The handler method for the config action. */
export const routeHandler = router
  .get("/config", getConfigRoute)
  .post("/config", setConfigRoute)
  .handler();
