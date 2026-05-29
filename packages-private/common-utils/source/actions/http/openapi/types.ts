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

import type { JsonSchema } from "@valibot/to-json-schema";
import type {
  InfoObject,
  OpenAPIObject,
  ReferenceObject,
  SchemaObject,
  SecurityRequirementObject,
  ServerObject,
} from "openapi3-ts/oas31";
import type { HttpActionRouter } from "../router";
import type { BaseContext } from "../types";

export type JsonSchemaDefinition = JsonSchema | boolean;
export type OpenAPISchema = SchemaObject | ReferenceObject;
export type ComponentSchemas = NonNullable<
  NonNullable<OpenAPIObject["components"]>["schemas"]
>;

/** OpenAPI 3.1 info object. */
export type OpenAPIInfo = InfoObject;

/** OpenAPI 3.1 specification object. */
export interface OpenAPISpec extends OpenAPIObject {
  openapi: "3.1.0";
  paths: NonNullable<OpenAPIObject["paths"]>;
}

/** Options for OpenAPI generation. */
export interface OpenAPIGenerationOptions {
  /** Whether unsupported schema conversions should be omitted or throw. */
  schemaErrorMode?: "omit" | "throw";

  /** Security requirements applied at the OpenAPI document root. */
  security?: SecurityRequirementObject[];

  /** Security schemes added to `components.securitySchemes`. */
  securitySchemes?: NonNullable<
    NonNullable<OpenAPIObject["components"]>["securitySchemes"]
  >;

  /** Server URLs where the documented API is available. */
  servers?: ServerObject[];
}

export interface JsonSchemaObject extends JsonSchema {
  $defs?: Record<string, JsonSchemaDefinition>;
  deprecated?: boolean;
  properties?: Record<string, JsonSchemaDefinition>;
}

export interface SchemaConversionContext {
  components: ComponentSchemas;
  options: Pick<OpenAPIGenerationOptions, "schemaErrorMode">;
}

export interface ConvertedSchema {
  schema: OpenAPISchema;
  source: JsonSchemaObject;
}

/** A router paired with its URL path prefix for OpenAPI generation. */
export interface RouterEntry<TContext extends BaseContext = BaseContext> {
  /** URL path prefix prepended to all routes (e.g., `"/app-config"`). */
  prefix?: string;

  /** The router instance containing the routes for this entry. */
  router: HttpActionRouter<TContext>;
}
