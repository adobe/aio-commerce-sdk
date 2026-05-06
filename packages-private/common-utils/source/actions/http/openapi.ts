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

import { toJsonSchema } from "@valibot/to-json-schema";

import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { HttpActionRouter } from "./router";
import type { CompiledRoute } from "./types";

/**
 * Subset of a JSON Schema object capturing the fields accessed during OpenAPI generation.
 * The index signature preserves arbitrary schema properties emitted by `@valibot/to-json-schema`.
 */
interface JsonSchemaObj {
  $defs?: Record<string, JsonSchemaObj>;
  $ref?: string;
  $schema?: string;
  deprecated?: boolean;
  description?: string;
  properties?: Record<string, JsonSchemaObj>;
  required?: string[];
  [key: string]: unknown;
}

/** OpenAPI 3.1 info object. */
export interface OpenAPIInfo {
  description?: string;
  title: string;
  version: string;
}

/** OpenAPI 3.1 parameter object. */
interface OpenAPIParameter {
  in: "path" | "query";
  name: string;
  required: boolean;
  schema: JsonSchemaObj;
}

/** OpenAPI 3.1 response object (subset). */
interface OpenAPIResponse {
  content?: { "application/json": { schema: JsonSchemaObj } };
  description: string;
}

/** OpenAPI 3.1 operation object (subset used by generated specs). */
interface OpenAPIOperation {
  deprecated?: true;
  parameters?: OpenAPIParameter[];
  requestBody?: {
    content: { "application/json": { schema: JsonSchemaObj } };
    required: true;
  };
  responses: Record<string, OpenAPIResponse>;
}

/** OpenAPI 3.1 specification object. */
export interface OpenAPISpec extends Record<string, unknown> {
  components?: { schemas: Record<string, JsonSchemaObj> };
  info: OpenAPIInfo;
  openapi: "3.1.0";
  paths: Record<string, Record<string, OpenAPIOperation>>;
}

const DEFS_REF_RE = /^#\/\$defs\/(.+)$/;

/** Converts a regexparam-style path to OpenAPI `{param}` style. */
function toOpenAPIPath(path: string): string {
  return path.replace(/:(\w+)/g, "{$1}");
}

/** Converts a StandardSchemaV1 to a JSON Schema object if it's a Valibot schema. */
function schemaToJsonSchema(schema: StandardSchemaV1): JsonSchemaObj | null {
  if (schema["~standard"].vendor !== "valibot") {
    return null;
  }

  try {
    // biome-ignore lint/suspicious/noExplicitAny: Valibot's BaseSchema<unknown,unknown,BaseIssue<unknown>> is not directly assignable from StandardSchemaV1
    return toJsonSchema(schema as any, {
      target: "draft-2020-12",
    }) as JsonSchemaObj;
  } catch {
    return null;
  }
}

/** Extracts path parameters from a compiled route's params schema. */
function buildPathParameters(route: CompiledRoute): OpenAPIParameter[] {
  if (!route.params) {
    return [];
  }

  const jsonSchema = schemaToJsonSchema(route.params);
  const properties = jsonSchema?.properties ?? {};

  return Object.entries(properties).map(([name, propSchema]) => ({
    in: "path" as const,
    name,
    required: true,
    schema: propSchema,
  }));
}

/** Extracts query parameters from a compiled route's query schema. */
function buildQueryParameters(route: CompiledRoute): OpenAPIParameter[] {
  if (!route.query) {
    return [];
  }

  const jsonSchema = schemaToJsonSchema(route.query);
  const properties = jsonSchema?.properties ?? {};
  const required = jsonSchema?.required ?? [];

  return Object.entries(properties).map(([name, propSchema]) => ({
    in: "query" as const,
    name,
    required: required.includes(name),
    schema: propSchema,
  }));
}

/** Builds the requestBody entry for a compiled route, if it has a body schema. */
function buildRequestBody(
  route: CompiledRoute,
): OpenAPIOperation["requestBody"] {
  if (!route.body) {
    return;
  }

  const jsonSchema = schemaToJsonSchema(route.body);

  if (!jsonSchema) {
    return;
  }

  return {
    content: { "application/json": { schema: jsonSchema } },
    required: true,
  };
}

/** Returns a default description for an HTTP status code. */
function defaultDescription(code: number): string {
  if (code === 204) {
    return "No content";
  }

  if (code === 404) {
    return "Not found";
  }

  if (code === 405) {
    return "Method not allowed";
  }

  if (code >= 500) {
    return "Internal server error";
  }

  if (code >= 400) {
    return "Bad request";
  }

  return "Success";
}

/**
 * Builds an OpenAPI response object from an optional schema.
 * If the schema carries a `description` via `v.metadata`, it is used as the response description.
 */
function buildResponseEntry(
  code: number,
  schema?: StandardSchemaV1,
): { response: OpenAPIResponse; deprecated: boolean } {
  const fallback = defaultDescription(code);

  if (!schema) {
    return { response: { description: fallback }, deprecated: false };
  }

  const jsonSchema = schemaToJsonSchema(schema);

  if (!jsonSchema) {
    return { response: { description: fallback }, deprecated: false };
  }

  const description =
    typeof jsonSchema.description === "string"
      ? jsonSchema.description
      : fallback;
  const deprecated = jsonSchema.deprecated === true;

  return {
    response: {
      content: { "application/json": { schema: jsonSchema } },
      description,
    },
    deprecated,
  };
}

/** Converts a single compiled route to an OpenAPI operation object. */
function routeToOperation(route: CompiledRoute): OpenAPIOperation {
  const parameters = [
    ...buildPathParameters(route),
    ...buildQueryParameters(route),
  ];
  const requestBody = buildRequestBody(route);

  // Collect declared per-status-code responses
  const declaredResponses: Record<string, OpenAPIResponse> = {};
  let deprecated = false;

  if (route.responses) {
    for (const [code, schema] of Object.entries(route.responses)) {
      const { response, deprecated: isDeprecated } = buildResponseEntry(
        Number(code),
        schema,
      );
      declaredResponses[code] = response;
      if (isDeprecated) {
        deprecated = true;
      }
    }
  }

  const hasDeclaredResponses = Object.keys(declaredResponses).length > 0;
  const responses: Record<string, OpenAPIResponse> = {
    // Fall back to a generic 200 only when no responses are declared at all
    ...(!hasDeclaredResponses && { "200": buildResponseEntry(200).response }),
    ...declaredResponses,
    "400": declaredResponses["400"] ?? buildResponseEntry(400).response,
    "404": declaredResponses["404"] ?? buildResponseEntry(404).response,
    "405": declaredResponses["405"] ?? buildResponseEntry(405).response,
    "500": declaredResponses["500"] ?? buildResponseEntry(500).response,
  };

  return {
    ...(deprecated && { deprecated: true as const }),
    ...(parameters.length > 0 && { parameters }),
    ...(requestBody && { requestBody }),
    responses,
  };
}

/** A router paired with its URL path prefix for OpenAPI generation. */
export interface RouterEntry {
  /** URL path prefix prepended to all routes (e.g., `"/app-config"`). */
  prefix?: string;
  // biome-ignore lint/suspicious/noExplicitAny: router context type is irrelevant for introspection
  router: HttpActionRouter<any>;
}

/**
 * Hoists all inline `$defs` into `components/schemas` and strips `$schema` annotations
 * from embedded schemas so that `$ref` resolution works correctly for OpenAPI tools.
 *
 * `@valibot/to-json-schema` places `$defs` inside each schema object and uses
 * `$ref: "#/$defs/N"` — but when embedded in an OpenAPI document, `#` resolves to
 * the document root, not the schema root. Moving definitions to `components/schemas`
 * (the standard OpenAPI location) fixes that. Keys are renamed with a counter prefix
 * to prevent collisions across schemas.
 */
function hoistToComponentSchemas(spec: OpenAPISpec): OpenAPISpec {
  const schemas: Record<string, JsonSchemaObj> = {};
  let seq = 0;

  function rewrite(
    node: JsonSchemaObj,
    remap: Record<string, string>,
  ): JsonSchemaObj;
  function rewrite(node: unknown, remap: Record<string, string>): unknown;
  function rewrite(node: unknown, remap: Record<string, string>): unknown {
    if (node === null || typeof node !== "object") {
      return node;
    }

    if (Array.isArray(node)) {
      return node.map((item) => rewrite(item, remap));
    }

    const obj = node as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (key === "$schema") {
        continue;
      }

      if (key === "$ref" && typeof value === "string") {
        const m = DEFS_REF_RE.exec(value);
        result[key] =
          m && remap[m[1]] ? `#/components/schemas/${remap[m[1]]}` : value;
      } else {
        result[key] = rewrite(value, remap);
      }
    }

    return result;
  }

  function liftDefs(schema: JsonSchemaObj): JsonSchemaObj {
    const { $defs, ...rest } = schema;
    const body = rest as JsonSchemaObj;

    if (!$defs) {
      return rewrite(body, {});
    }

    const remap: Record<string, string> = {};
    for (const key of Object.keys($defs)) {
      remap[key] = `Ref${seq++}`;
    }

    for (const [key, def] of Object.entries($defs)) {
      schemas[remap[key]] = liftDefs(rewrite(def, remap));
    }

    return rewrite(body, remap);
  }

  function walkOperation(op: OpenAPIOperation): OpenAPIOperation {
    const result = { ...op };

    if (result.requestBody) {
      const schema = result.requestBody.content["application/json"]?.schema;
      if (schema) {
        result.requestBody = {
          ...result.requestBody,
          content: { "application/json": { schema: liftDefs(schema) } },
        };
      }
    }

    const responses: Record<string, OpenAPIResponse> = {};
    for (const [code, response] of Object.entries(result.responses)) {
      const schema = response.content?.["application/json"]?.schema;
      responses[code] = schema
        ? {
            ...response,
            content: { "application/json": { schema: liftDefs(schema) } },
          }
        : response;
    }
    result.responses = responses;

    return result;
  }

  const paths: Record<string, Record<string, OpenAPIOperation>> = {};
  for (const [path, methods] of Object.entries(spec.paths)) {
    paths[path] = {};
    for (const [method, op] of Object.entries(methods)) {
      paths[path][method] = walkOperation(op);
    }
  }

  const out: OpenAPISpec = { ...spec, paths };
  if (Object.keys(schemas).length > 0) {
    out.components = { schemas };
  }

  return out;
}

/**
 * Generates an OpenAPI 3.1 specification from one or more `HttpActionRouter` instances.
 *
 * Schemas must use Valibot; routes using other libraries will have their request
 * shapes omitted from the spec but the operation will still be included.
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
): OpenAPISpec {
  const routerEntries = Array.isArray(entries) ? entries : [entries];
  const paths: Record<string, Record<string, OpenAPIOperation>> = {};

  for (const { prefix = "", router } of routerEntries) {
    for (const route of router.getRoutes()) {
      const openAPIPath = toOpenAPIPath(prefix + route.path);
      const method = route.method.toLowerCase();

      paths[openAPIPath] ??= {};
      paths[openAPIPath][method] = routeToOperation(route);
    }
  }

  return hoistToComponentSchemas({ info, openapi: "3.1.0", paths });
}
