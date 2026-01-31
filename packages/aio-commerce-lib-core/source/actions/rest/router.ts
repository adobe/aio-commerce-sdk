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

import { parse } from "regexparam";

import {
  badRequest,
  internalServerError,
  methodNotAllowed,
  notFound,
} from "#responses/presets";

import { parseQueryParams, parseRequestBody, validateSchema } from "./utils";

import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { HttpMethod, RuntimeActionParams } from "#params/types";
import type {
  BaseContext,
  CompiledRoute,
  ContextBuilder,
  RouteConfig,
  RouteResponse,
} from "./types";

/**
 * REST router for Adobe I/O Runtime actions.
 * Provides type-safe routing with schema validation and OpenWhisk integration.
 *
 * @example
 * ```typescript
 * const router = new Router();
 *
 * router.get("/users/:id", {
 *   handler: (req) => ok({ id: req.params.id, context: req.context })
 * });
 *
 * // Add context builders
 * router.use(async (base) => ({
 *   user: await getUser(base.raw.__ow_headers?.authorization),
 * }));
 *
 * export const main = router.handler();
 * ```
 */
export class Router {
  private readonly routes: CompiledRoute[] = [];
  private readonly contextBuilders: ContextBuilder[] = [];

  /**
   * Internal method to add a route to the router.
   */
  private addRoute<
    TPattern extends string,
    TParamsSchema extends StandardSchemaV1 | undefined,
    TBodySchema extends StandardSchemaV1 | undefined,
    TQuerySchema extends StandardSchemaV1 | undefined,
  >(
    method: HttpMethod,
    path: TPattern,
    config: RouteConfig<TPattern, TParamsSchema, TBodySchema, TQuerySchema>,
  ): this {
    const { pattern, keys } = parse(path);
    this.routes.push({
      method,
      pattern,
      keys,
      // Cast needed because config.params type includes compile-time error type
      params: config.params as StandardSchemaV1 | undefined,
      body: config.body,
      query: config.query,
      handler: config.handler,
    });

    return this;
  }

  /**
   * Register a GET route.
   *
   * @example
   * ```typescript
   * router.get("/users/:id", {
   *   handler: (req) => ok({ id: req.params.id })
   * });
   * ```
   */
  public get<
    TPattern extends string,
    TParamsSchema extends StandardSchemaV1 | undefined = undefined,
    TQuerySchema extends StandardSchemaV1 | undefined = undefined,
  >(
    path: TPattern,
    config: RouteConfig<TPattern, TParamsSchema, undefined, TQuerySchema>,
  ): this {
    return this.addRoute("GET", path, config);
  }

  /**
   * Register a POST route.
   *
   * @example
   * ```typescript
   * router.post("/users", {
   *   body: userSchema,
   *   handler: (req) => created(req.body)
   * });
   * ```
   */
  public post<
    TPattern extends string,
    TParamsSchema extends StandardSchemaV1 | undefined = undefined,
    TBodySchema extends StandardSchemaV1 | undefined = undefined,
    TQuerySchema extends StandardSchemaV1 | undefined = undefined,
  >(
    path: TPattern,
    config: RouteConfig<TPattern, TParamsSchema, TBodySchema, TQuerySchema>,
  ): this {
    return this.addRoute("POST", path, config);
  }

  /**
   * Register a PUT route.
   *
   * @example
   * ```typescript
   * router.put("/users/:id", {
   *   body: userSchema,
   *   handler: (req) => ok(req.body)
   * });
   * ```
   */
  public put<
    TPattern extends string,
    TParamsSchema extends StandardSchemaV1 | undefined = undefined,
    TBodySchema extends StandardSchemaV1 | undefined = undefined,
    TQuerySchema extends StandardSchemaV1 | undefined = undefined,
  >(
    path: TPattern,
    config: RouteConfig<TPattern, TParamsSchema, TBodySchema, TQuerySchema>,
  ): this {
    return this.addRoute("PUT", path, config);
  }

  /**
   * Register a PATCH route.
   *
   * @example
   * ```typescript
   * router.patch("/users/:id", {
   *   body: partialUserSchema,
   *   handler: (req) => ok(req.body)
   * });
   * ```
   */
  public patch<
    TPattern extends string,
    TParamsSchema extends StandardSchemaV1 | undefined = undefined,
    TBodySchema extends StandardSchemaV1 | undefined = undefined,
    TQuerySchema extends StandardSchemaV1 | undefined = undefined,
  >(
    path: TPattern,
    config: RouteConfig<TPattern, TParamsSchema, TBodySchema, TQuerySchema>,
  ): this {
    return this.addRoute("PATCH", path, config);
  }

  /**
   * Register a DELETE route.
   *
   * @example
   * ```typescript
   * router.delete("/users/:id", {
   *   handler: (req) => noContent()
   * });
   * ```
   */
  public delete<
    TPattern extends string,
    TParamsSchema extends StandardSchemaV1 | undefined = undefined,
    TQuerySchema extends StandardSchemaV1 | undefined = undefined,
  >(
    path: TPattern,
    config: RouteConfig<TPattern, TParamsSchema, undefined, TQuerySchema>,
  ): this {
    return this.addRoute("DELETE", path, config);
  }

  /**
   * Register a context builder that runs before route handlers.
   * Context builders can add properties to the request context.
   * Multiple builders are executed in order and their results are merged.
   *
   * @param builder - Function that receives base context and returns additional context
   * @returns The router instance for chaining
   *
   * @example
   * ```typescript
   * router.use(async (base) => ({
   *   user: await authenticateUser(base.raw.__ow_headers?.authorization),
   *   logger: createLogger(base.raw),
   * }));
   * ```
   */
  public use(builder: ContextBuilder): this {
    this.contextBuilders.push(builder);
    return this;
  }

  /**
   * Builds the full context by running all context builders.
   */
  private async buildContext(args: RuntimeActionParams): Promise<BaseContext> {
    // biome-ignore lint/suspicious/noExplicitAny: Runtime context building requires dynamic typing
    let context: any = { raw: args };

    for (const builder of this.contextBuilders) {
      const result = await builder(context);
      if (result) {
        context = { ...context, ...result };
      }
    }

    return context as BaseContext;
  }

  /**
   * Validates and extracts route parameters.
   */
  private async validateParams(
    route: CompiledRoute,
    params: Record<string, string>,
  ) {
    if (!route.params) {
      return { success: true, data: params };
    }

    const result = await validateSchema(route.params, params);
    if (!result.success) {
      return { success: false, issues: result.issues };
    }

    return { success: true, data: result.data };
  }

  /**
   * Validates request body.
   */
  private async validateBody(route: CompiledRoute, body: unknown) {
    if (!route.body) {
      return { success: true, data: body };
    }

    const result = await validateSchema(route.body, body);
    if (!result.success) {
      return { success: false, issues: result.issues };
    }

    return { success: true, data: result.data };
  }

  /**
   * Validates query parameters.
   */
  private async validateQuery(
    route: CompiledRoute,
    query: Record<string, string>,
  ) {
    if (!route.query) {
      return { success: true, data: query };
    }

    const result = await validateSchema(route.query, query);

    if (!result.success) {
      return { success: false, issues: result.issues };
    }
    return { success: true, data: result.data };
  }

  /** Handles a matched route by validating inputs and calling the handler. */
  private async handleRoute(
    route: CompiledRoute,
    match: RegExpExecArray,
    body: unknown,
    query: Record<string, string>,
    headers: Record<string, string>,
    method: HttpMethod,
    path: string,
    context: BaseContext,
  ): Promise<RouteResponse | null> {
    const params: Record<string, string> = {};
    route.keys.forEach((key, i) => {
      params[key] = decodeURIComponent(match[i + 1] || "");
    });

    const paramsResult = await this.validateParams(route, params);
    if (!paramsResult.success) {
      return badRequest({
        body: {
          message: "Invalid route parameters",
          issues: paramsResult.issues,
        },
      });
    }

    const bodyResult = await this.validateBody(route, body);
    if (!bodyResult.success) {
      return badRequest({
        body: {
          message: "Invalid request body",
          issues: bodyResult.issues,
        },
      });
    }

    const queryResult = await this.validateQuery(route, query);
    if (!queryResult.success) {
      return badRequest({
        body: {
          message: "Invalid query parameters",
          issues: queryResult.issues,
        },
      });
    }

    try {
      return await route.handler(
        {
          params: paramsResult.data,
          body: bodyResult.data,
          query: queryResult.data,
          headers,
          method,
          path,
        },
        context,
      );
    } catch (err) {
      console.error("Handler error:", err);
      return internalServerError({
        body: {
          message: "Internal server error",
          error: err instanceof Error ? err.message : "Unknown error",
        },
      });
    }
  }

  /**
   * Creates an OpenWhisk/Runtime action handler from the registered routes.
   *
   * @example
   * ```typescript
   * const router = new Router();
   * router.get("/hello", { handler: () => ok({ message: "Hello!" }) });
   *
   * export const main = router.handler();
   * ```
   */
  public handler() {
    return async (args: RuntimeActionParams): Promise<RouteResponse> => {
      const method = (args.__ow_method || "get").toUpperCase() as HttpMethod;
      const path = (args.__ow_path as string) || "/";
      const headers = (args.__ow_headers as Record<string, string>) || {};
      const body = parseRequestBody(args.__ow_body);
      const query = parseQueryParams(args.__ow_query, args);

      // Build context from all registered context builders
      const context = await this.buildContext(args);

      const matchedMethods: HttpMethod[] = [];

      for (const route of this.routes) {
        const match = route.pattern.exec(path);
        if (!match) {
          continue;
        }

        matchedMethods.push(route.method);
        if (route.method !== method) {
          continue;
        }

        const response = await this.handleRoute(
          route,
          match,
          body,
          query,
          headers,
          method,
          path,
          context,
        );

        if (response) {
          return response;
        }
      }

      // If path matched but method didn't, return 405
      if (matchedMethods.length > 0) {
        return methodNotAllowed(`Method ${method} not allowed`);
      }

      return notFound(`No route matches ${path}`);
    };
  }
}

/**
 * Define a route handler separately from registration.
 * Useful for organizing route handlers in separate files or reusing handlers.
 *
 * @template TContext - Optional context type for typed context access
 *
 * @example
 * ```typescript
 * import { object, string } from "valibot";
 *
 * // Basic usage
 * const getUserById = defineRoute({
 *   params: object({ id: string() }),
 *   handler: (req) => ok({ id: req.params.id })
 * });
 *
 * // With typed context
 * interface MyContext extends BaseContext {
 *   user: { id: string; name: string };
 * }
 *
 * const getMe = defineRoute<MyContext>({
 *   handler: (req) => ok({ name: req.context.user.name })
 * });
 *
 * router.get("/users/:id", getUserById);
 * router.get("/me", getMe);
 * ```
 */
export function defineRoute<
  TContext extends BaseContext = BaseContext,
  TParamsSchema extends StandardSchemaV1 | undefined = undefined,
  TBodySchema extends StandardSchemaV1 | undefined = undefined,
  TQuerySchema extends StandardSchemaV1 | undefined = undefined,
>(
  config: RouteConfig<string, TParamsSchema, TBodySchema, TQuerySchema, TContext>,
): RouteConfig<string, TParamsSchema, TBodySchema, TQuerySchema, TContext> {
  return config;
}
