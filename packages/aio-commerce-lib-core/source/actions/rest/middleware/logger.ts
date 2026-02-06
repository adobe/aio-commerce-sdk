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

import AioLogger from "@adobe/aio-lib-core-logging";

import type { BaseContext, ContextBuilder } from "../types";

type LoggerInstance = ReturnType<typeof AioLogger>;
type AioLoggerOptions = Parameters<typeof AioLogger>[1];

export interface LoggerOptions extends NonNullable<AioLoggerOptions> {
  name?: (ctx: BaseContext) => string;
}

export interface LoggerContext extends Record<string, unknown> {
  logger: LoggerInstance;
}

/**
 * Creates a logger middleware that adds logging capabilities to the context.
 *
 * @example
 * ```typescript
 * router.use(logger({ level: "debug", name: () => "my-logger-name" }));
 *
 * router.get("/test", {
 *   handler: (req, ctx) => {
 *     ctx.logger.info("Hello world");
 *     return ok({ body: {} });
 *   },
 * });
 * ```
 */
export function logger({
  name,
  ...restOptions
}: LoggerOptions = {}): ContextBuilder<BaseContext, LoggerContext> {
  return (ctx) => {
    const params = ctx.raw;

    const loggerName = `${params.__ow_method}-${name?.(ctx) ?? process.env.__OW_ACTION_NAME}`;
    const logger = AioLogger(loggerName, {
      level: `${params.LOG_LEVEL ?? "info"}`,
      ...restOptions,
    });

    return { logger };
  };
}
