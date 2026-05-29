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

import { assignIfDefined } from "#utils/object";

import { convertSchema, toOpenAPISchema } from "./schema";

import type { HttpMethod } from "@adobe/aio-commerce-lib-core/params";
import type {
  OpenAPIObject,
  OperationObject,
  ParameterObject,
  RequestBodyObject,
  ResponseObject,
} from "openapi3-ts/oas31";
import type { CompiledRoute, RouteResponseMetadata } from "../types";
import type {
  OpenAPIGenerationOptions,
  OpenAPIInfo,
  OpenAPISpec,
  RouterEntry,
  SchemaConversionContext,
} from "./types";

const DEFAULT_RESPONSES = {
  200: "The request was successful and the response body contains the representation requested.",
  202: "The request has been accepted for processing, but the processing is not complete.",
  204: "The request was successful and there is no content to return.",
  400: "The request is invalid or could not be parsed.",
  500: "An unexpected server error occurred.",
} as const;

/** Builds the OpenAPI components object when schemas or security schemes exist. */
function buildComponents(
  context: SchemaConversionContext,
  options: OpenAPIGenerationOptions,
): OpenAPIObject["components"] | undefined {
  const hasSchemas = Object.keys(context.components).length > 0;

  if (!(hasSchemas || options.securitySchemes)) {
    return;
  }

  return {
    ...(hasSchemas && { schemas: context.components }),
    ...(options.securitySchemes && {
      securitySchemes: options.securitySchemes,
    }),
  };
}

/** Converts a regexparam-style path to OpenAPI `{param}` style. */
function toOpenAPIPath(path: string): string {
  const openAPIPath = path.replace(/:(\w+)/g, "{$1}");

  if (openAPIPath.length > 1 && openAPIPath.endsWith("/")) {
    return openAPIPath.slice(0, -1);
  }

  return openAPIPath;
}

/** Extracts path parameters from a compiled route's params schema. */
function buildPathParameters(
  route: CompiledRoute,
  context: SchemaConversionContext,
): ParameterObject[] {
  if (!route.params) {
    return [];
  }

  const converted = convertSchema(route.params, context);
  const properties = converted?.source.properties ?? {};

  return Object.entries(properties).map(([name, propSchema]) => ({
    in: "path" as const,
    name,
    required: true,
    schema: toOpenAPISchema(propSchema),
  }));
}

/** Extracts query parameters from a compiled route's query schema. */
function buildQueryParameters(
  route: CompiledRoute,
  context: SchemaConversionContext,
): ParameterObject[] {
  if (!route.query) {
    return [];
  }

  const converted = convertSchema(route.query, context);
  const properties = converted?.source.properties ?? {};
  const required = converted?.source.required ?? [];

  return Object.entries(properties).map(([name, propSchema]) => ({
    in: "query" as const,
    name,
    required: required.includes(name),
    schema: toOpenAPISchema(propSchema),
  }));
}

/** Builds the requestBody entry for a compiled route, if it has a body schema. */
function buildRequestBody(
  route: CompiledRoute,
  context: SchemaConversionContext,
): RequestBodyObject | undefined {
  if (!route.body) {
    return;
  }

  const converted = convertSchema(route.body, context);

  if (!converted) {
    return;
  }

  return {
    content: { "application/json": { schema: converted.schema } },
    required: true,
  };
}

/** Returns a default description for an HTTP status code. */
function defaultDescription(code: number): string {
  const exactDescription =
    DEFAULT_RESPONSES[code as keyof typeof DEFAULT_RESPONSES];

  if (!exactDescription) {
    throw new Error(`No default description for status code ${code}`);
  }

  return exactDescription;
}

/** Returns router responses that can happen while executing a matched route. */
function routerManagedResponseCodes(route: CompiledRoute): number[] {
  const hasValidation = Boolean(route.body || route.params || route.query);

  return [...(hasValidation ? [400] : []), 500];
}

/** Builds an OpenAPI response object from an optional schema and route metadata. */
function buildResponseEntry(
  code: number,
  metadata: RouteResponseMetadata | undefined,
  context: SchemaConversionContext,
): ResponseObject {
  const schema = metadata?.schema;
  const metadataDescription = metadata?.description;
  const responseDescription = () =>
    metadataDescription ?? defaultDescription(code);

  if (!schema) {
    return { description: responseDescription() };
  }

  const converted = convertSchema(schema, context);

  if (!converted) {
    return { description: responseDescription() };
  }

  const description =
    metadataDescription ??
    (typeof converted.source.description === "string"
      ? converted.source.description
      : defaultDescription(code));

  return {
    description,
    content: {
      "application/json": { schema: converted.schema },
    },
  };
}

/** Builds every response declared for a route and fills router-managed defaults. */
function buildOperationResponses(
  route: CompiledRoute,
  metadataResponses: Partial<Record<number, RouteResponseMetadata>> | undefined,
  context: SchemaConversionContext,
): Record<string, ResponseObject> {
  const responses: Record<string, ResponseObject> = {};
  const setResponse = (
    code: number,
    metadata: RouteResponseMetadata | undefined,
  ) => {
    responses[String(code)] = buildResponseEntry(code, metadata, context);
  };

  for (const [code, metadata] of Object.entries(metadataResponses ?? {})) {
    if (metadata) {
      setResponse(Number(code), metadata);
    }
  }

  if (Object.keys(responses).length === 0) {
    throw new Error("At least one response must be defined in route metadata");
  }

  for (const code of routerManagedResponseCodes(route)) {
    const statusCode = String(code);
    if (!responses[statusCode]) {
      setResponse(code, metadataResponses?.[code]);
    }
  }

  return responses;
}

/** Converts a single compiled route to an OpenAPI operation object. */
function routeToOperation(
  route: CompiledRoute,
  context: SchemaConversionContext,
): OperationObject {
  const parameters = [
    ...buildPathParameters(route, context),
    ...buildQueryParameters(route, context),
  ];

  const requestBody = buildRequestBody(route, context);
  const { metadata } = route;

  const responses = buildOperationResponses(
    route,
    metadata?.responses,
    context,
  );
  const operation: OperationObject = {
    responses,
  };

  assignIfDefined(operation, "summary", metadata?.summary);
  assignIfDefined(operation, "operationId", metadata?.operationId);
  assignIfDefined(operation, "deprecated", metadata?.deprecated);
  assignIfDefined(operation, "tags", metadata?.tags);
  assignIfDefined(operation, "description", metadata?.description);
  assignIfDefined(operation, "requestBody", requestBody);
  assignIfDefined(operation, "security", metadata?.security);
  assignIfDefined(
    operation,
    "parameters",
    parameters.length > 0 ? parameters : undefined,
  );

  return operation;
}

/**
 * Generates an OpenAPI 3.1 specification from one or more `HttpActionRouter` instances.
 * Route schemas must use Valibot (currently the only schema library that is supported).
 *
 * @example
 * ```typescript
 * const spec = generateOpenAPISpec(
 *   [{ prefix: "/app-config", router }],
 *   { title: "My API", version: "1.0.0" },
 * );
 * ```
 */
export function generateOpenAPISpec(
  entries: RouterEntry | RouterEntry[],
  info: OpenAPIInfo,
  options: OpenAPIGenerationOptions = {},
): OpenAPISpec {
  const routerEntries = Array.isArray(entries) ? entries : [entries];
  const paths: OpenAPISpec["paths"] = {};
  const context: SchemaConversionContext = {
    options,
    components: {},
  };

  for (const { prefix = "", router } of routerEntries) {
    for (const route of router.getRoutes()) {
      if (route.metadata?.internal) {
        continue;
      }

      const openAPIPath = toOpenAPIPath(prefix + route.path);
      const method = route.method.toLowerCase() as Lowercase<HttpMethod>;

      if (!paths[openAPIPath]) {
        paths[openAPIPath] = {};
      }

      const pathItem = paths[openAPIPath];
      pathItem[method] = routeToOperation(route, context);
    }
  }

  const components = buildComponents(context, options);
  return {
    info,
    openapi: "3.1.0",
    paths,

    ...(options.security && { security: options.security }),
    ...(options.servers && { servers: options.servers }),
    ...(components && { components }),
  };
}
