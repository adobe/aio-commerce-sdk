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

import { describe, expect, it } from "vitest";

import { logger } from "#actions/http/middleware/index";
import { HttpActionRouter } from "#actions/http/router";
import { ok } from "#responses/presets";

import type { RuntimeActionParams } from "#params/types";

interface LoggerContext {
  logger: {
    info: (msg: string) => void;
  };
}

describe("Middleware Plugins", () => {
  describe("logger()", () => {
    it("should add logger to context", async () => {
      const router = new HttpActionRouter();
      router.use(logger());

      router.get("/test", {
        handler: (_req, ctx) => {
          const { logger: log } = ctx as unknown as LoggerContext;
          return ok({ body: { hasLogger: typeof log.info === "function" } });
        },
      });

      const handler = router.handler();
      const result = await handler({
        __ow_method: "get",
        __ow_path: "/test",
      } as RuntimeActionParams);

      expect(result).toMatchObject({
        statusCode: 200,
        body: { hasLogger: true },
      });
    });

    it("should use custom name function", async () => {
      const router = new HttpActionRouter();
      router.use(logger({ name: () => "custom-action" }));

      router.get("/test", {
        handler: (_req, ctx) => {
          const { logger: log } = ctx as unknown as LoggerContext;
          return ok({ body: { hasLogger: typeof log.info === "function" } });
        },
      });

      const handler = router.handler();
      const result = await handler({
        __ow_method: "get",
        __ow_path: "/test",
      } as RuntimeActionParams);

      expect(result).toMatchObject({
        statusCode: 200,
        body: { hasLogger: true },
      });
    });

    it("should use LOG_LEVEL from params", async () => {
      const router = new HttpActionRouter();
      router.use(logger());

      router.get("/test", {
        handler: (_req, ctx) => {
          const { logger: log } = ctx as unknown as LoggerContext;
          return ok({ body: { hasLogger: typeof log.info === "function" } });
        },
      });

      const handler = router.handler();
      const result = await handler({
        __ow_method: "get",
        __ow_path: "/test",
        LOG_LEVEL: "debug",
      } as RuntimeActionParams);

      expect(result).toMatchObject({
        statusCode: 200,
        body: { hasLogger: true },
      });
    });
  });
});
