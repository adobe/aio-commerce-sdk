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

import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { EmptyObject, Promisable, Simplify } from "type-fest";
import type { HttpMethod } from "#params/types";
import type { ActionResponse } from "#responses/helpers";

// Extract named :param segments
type ExtractNamedParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param extends `${infer P}?`
      ? { [K in P]?: string } & ExtractNamedParams<Rest>
      : { [K in Param]: string } & ExtractNamedParams<`/${Rest}`>
    : T extends `${string}:${infer Param}`
      ? Param extends `${infer P}?`
        ? { [K in P]?: string }
        : { [K in Param]: string }
      : EmptyObject;

/**
 * Extracts all route parameters from a path string, including both named parameters and wildcard segments.
 *
 * @example
 * // Named parameters only
 * type Params1 = ExtractParams<"/users/:id/posts/:postId">; // { id: string; postId: string }
 *
 * // Named parameters with wildcard
 * type Params2 = ExtractParams<"/api/:version/*">; // { version: string; wild: string }
 *
 * // Optional parameter
 * type Params3 = ExtractParams<"/products/:category/:id?">; // { category: string; id?: string }
 */
export type ExtractParams<T extends string> = T extends `${infer Before}/*`
  ? Simplify<ExtractNamedParams<Before> & { wild: string }>
  : ExtractNamedParams<T>;

/**
 * Represents an incoming route request with typed parameters, body, and query.
 *
 * @template TParams - Type of route parameters (extracted from path)
 * @template TBody - Type of request body
 * @template TQuery - Type of query parameters
 */
export interface RouteRequest<TParams, TBody, TQuery> {
  /** Route parameters extracted from the URL path */
  params: TParams;

  /** Parsed request body */
  body: TBody;

  /** Query string parameters */
  query: TQuery;

  /** HTTP headers from the request */
  headers: Record<string, string>;

  /** HTTP method used for the request */
  method: HttpMethod;

  /** The matched path */
  path: string;
}

/** Internal compiled route representation used by the router. */
export interface CompiledRoute {
  /** HTTP method for this route */
  method: HttpMethod;

  /** Compiled regex pattern for path matching */
  pattern: RegExp;

  /** Extracted parameter names from the path */
  keys: string[];

  /** Optional schema for validating route parameters */
  params?: StandardSchemaV1;

  /** Optional schema for validating request body */
  body?: StandardSchemaV1;

  /** Optional schema for validating query parameters */
  query?: StandardSchemaV1;

  /** Route handler function */
  handler: (
    // biome-ignore lint/suspicious/noExplicitAny: Internal storage needs to accept any route handler signature
    req: RouteRequest<any, any, any>,
  ) => Promisable<ActionResponse>;
}

/**
 * Route configuration with type inference from schemas.
 * If schemas are provided, they're used for both validation AND type inference.
 * Otherwise, types are inferred from the path pattern.
 *
 * @template TPattern - The route path pattern string
 * @template TParamsSchema - Optional schema for route parameters
 * @template TBodySchema - Optional schema for request body
 * @template TQuerySchema - Optional schema for query parameters
 */
export type RouteConfig<
  TPattern extends string,
  TParamsSchema extends StandardSchemaV1 | undefined,
  TBodySchema extends StandardSchemaV1 | undefined,
  TQuerySchema extends StandardSchemaV1 | undefined,
> = {
  /** Optional schema for validating and typing route parameters */
  params?: TParamsSchema;

  /** Optional schema for validating and typing request body */
  body?: TBodySchema;

  /** Optional schema for validating and typing query parameters */
  query?: TQuerySchema;

  /** Route handler with properly typed request - returns ActionResponse from existing response utilities */
  handler: (
    req: RouteRequest<
      TParamsSchema extends StandardSchemaV1
        ? StandardSchemaV1.InferOutput<TParamsSchema>
        : Simplify<ExtractParams<TPattern>>,
      TBodySchema extends StandardSchemaV1
        ? StandardSchemaV1.InferOutput<TBodySchema>
        : unknown,
      TQuerySchema extends StandardSchemaV1
        ? StandardSchemaV1.InferOutput<TQuerySchema>
        : Record<string, string>
    >,
  ) => Promisable<ActionResponse>;
};
