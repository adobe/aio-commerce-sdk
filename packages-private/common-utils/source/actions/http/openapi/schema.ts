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
import type { JsonSchema } from "@valibot/to-json-schema";
import type { GenericSchema } from "valibot";
import type {
  ComponentSchemas,
  ConvertedSchema,
  JsonSchemaDefinition,
  JsonSchemaObject,
  OpenAPISchema,
  SchemaConversionContext,
} from "./types";

/** Converts JSON Schema boolean schemas to their OpenAPI schema equivalent. */
export function toOpenAPISchema(schema: JsonSchemaDefinition): OpenAPISchema {
  if (typeof schema !== "boolean") {
    return schema as OpenAPISchema;
  }

  return schema ? {} : { not: {} };
}

/** Normalizes an explicit schema title into an OpenAPI component name. */
function sanitizeComponentName(name: string): string {
  return name.replaceAll(/\s+/g, "").replaceAll(/[^A-Za-z0-9._-]/g, "");
}

/** Reads an explicit JSON Schema title, when present. */
function schemaTitle(schema: JsonSchemaDefinition): string | undefined {
  if (typeof schema !== "object" || schema === null) {
    return;
  }

  if (typeof schema.title === "string") {
    return schema.title;
  }
}

/** Returns the component name for a hoisted definition. */
function definitionComponentName(
  definition: JsonSchemaDefinition,
  referenceId: string,
): string {
  const title = schemaTitle(definition);
  const name = title ? sanitizeComponentName(title) : undefined;

  if (!name) {
    throw new Error(
      `OpenAPI component schema "${referenceId}" must define a title`,
    );
  }

  return name;
}

/** Removes JSON Schema-only metadata before embedding a schema in OpenAPI. */
function stripSchemaAnnotations(schema: JsonSchema): OpenAPISchema {
  const {
    $defs: _defs,
    $schema: _schema,
    ...body
  } = schema as JsonSchemaObject;

  return toOpenAPISchema(body);
}

/** Builds a local OpenAPI component reference. */
function componentRef(name: string): string {
  return `#/components/schemas/${name}`;
}

/** Maps local JSON Schema definition ids to explicit component names. */
function collectDefinitionNames(
  definitions: Record<string, JsonSchemaDefinition> | undefined,
  names: Map<string, string>,
) {
  if (!definitions) {
    return;
  }

  for (const [referenceId, definition] of Object.entries(definitions)) {
    const name = definitionComponentName(definition, referenceId);
    const nestedDefinitions =
      typeof definition === "object" && definition !== null
        ? definition.$defs
        : undefined;

    names.set(referenceId, name);
    collectDefinitionNames(nestedDefinitions, names);
  }
}

/** Rewrites local definition refs to their final OpenAPI component refs. */
function rewriteSchemaRefs(
  node: JsonSchemaDefinition,
  names: Map<string, string>,
): JsonSchemaDefinition {
  if (typeof node !== "object" || node === null) {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map((item) =>
      rewriteSchemaRefs(item, names),
    ) as JsonSchemaDefinition;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(node)) {
    if (key === "$ref" && typeof value === "string") {
      const localRef = value.replace("#/components/schemas/", "");
      const name = names.get(localRef);
      result[key] = name ? componentRef(name) : value;

      continue;
    }

    result[key] = rewriteSchemaRefs(value as JsonSchemaDefinition, names);
  }

  return result as JsonSchemaDefinition;
}

/** Compares schema objects after conversion. */
function schemasMatch(left: OpenAPISchema, right: OpenAPISchema): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

/** Collects hoisted JSON Schema definitions as OpenAPI components. */
function collectComponents(
  definitions: Record<string, JsonSchemaDefinition> | undefined,
  names: Map<string, string>,
  components: ComponentSchemas,
): ComponentSchemas {
  if (!definitions) {
    return components;
  }

  for (const [referenceId, definition] of Object.entries(definitions)) {
    const name = names.get(referenceId);

    if (!name) {
      continue;
    }

    const existing = components[name];
    const component = stripSchemaAnnotations(
      toOpenAPISchema(rewriteSchemaRefs(definition, names)),
    );

    if (existing && !schemasMatch(existing, component)) {
      throw new Error(
        `OpenAPI component title "${name}" resolves to multiple schemas`,
      );
    }

    components[name] = component;

    const nestedDefinitions =
      typeof definition === "object" && definition !== null
        ? definition.$defs
        : undefined;

    collectComponents(nestedDefinitions, names, components);
  }

  return components;
}

/** Registers converted components and rejects conflicting explicit titles. */
function registerDefinitions(
  definitions: Record<string, JsonSchemaDefinition> | undefined,
  names: Map<string, string>,
  context: SchemaConversionContext,
) {
  const components = collectComponents(definitions, names, {});

  for (const [name, component] of Object.entries(components)) {
    const existing = context.components[name];

    if (existing && !schemasMatch(existing, component)) {
      throw new Error(
        `OpenAPI component title "${name}" resolves to multiple schemas`,
      );
    }
  }

  Object.assign(context.components, components);
}

/** Converts a schema to OpenAPI using Valibot's JSON Schema converter. */
export function convertSchema(
  schema: StandardSchemaV1,
  context: SchemaConversionContext,
): ConvertedSchema | null {
  if (schema["~standard"].vendor !== "valibot") {
    throw new Error(
      "Currently, only Valibot schemas are supported for OpenAPI conversion",
    );
  }

  const names = new Map<string, string>();

  try {
    const source = toJsonSchema(schema as GenericSchema, {
      errorMode: "throw",
      target: "draft-2020-12",

      overrideRef: ({ referenceId }) => componentRef(referenceId),
    });

    collectDefinitionNames(source.$defs, names);
    registerDefinitions(source.$defs, names, context);

    return {
      source,
      schema: stripSchemaAnnotations(
        toOpenAPISchema(rewriteSchemaRefs(source, names)),
      ),
    };
  } catch (error) {
    if (context.options.schemaErrorMode !== "throw") {
      return null;
    }

    throw new Error("Failed to convert Valibot schema to JSON Schema", {
      cause: error,
    });
  }
}
