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

import { createHash } from "node:crypto";

import { parseOrThrow } from "@aio-commerce-sdk/common-utils/valibot";
import stringify from "safe-stable-stringify";

import { SchemaBusinessConfig } from "./index";

import type { BusinessConfigSchema, CommerceFlavor } from "./types";

/** A regex matching a regular SaaS API URL, with a tenant ID and optional trailing slash. */
const COMMERCE_SAAS_API_URL_REGEX =
  /^([a-zA-Z0-9-]+\.)?api\.commerce\.adobe\.com\/[a-zA-Z0-9-]+\/?$/;

/** Accepts base64 and base64url-safe encoded strings. */
const BASE64_LIKE_REGEX = /^[A-Za-z0-9+/_=-]+$/;

/** Matches an http(s) URL prefix. */
const HTTP_URL_PREFIX_REGEX = /^https?:\/\//i;

/** Runtime context keys used to resolve the Commerce flavor. */
type CommerceFlavorContext = {
  AIO_COMMERCE_API_FLAVOR?: unknown;
  AIO_COMMERCE_API_BASE_URL?: unknown;
};

/** Type guard for the supported Commerce flavor values. */
function isCommerceFlavor(input: unknown): input is CommerceFlavor {
  return input === "paas" || input === "saas";
}

/** Tries to decode a value that might be base64/base64url encoded URL text. */
function decodePossibleBase64Url(value: string): string | undefined {
  const candidate = value.trim();
  if (candidate.length === 0 || !BASE64_LIKE_REGEX.test(candidate)) {
    return;
  }

  const normalized = candidate.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  try {
    const decoded = Buffer.from(padded, "base64").toString("utf8").trim();

    return HTTP_URL_PREFIX_REGEX.test(decoded) ? decoded : undefined;
  } catch {
    return;
  }
}

/** Parses a URL directly, then falls back to parsing decoded base64/base64url input. */
function parseCommerceUrl(input: string): URL | undefined {
  try {
    return new URL(input);
  } catch {
    const decodedUrl = decodePossibleBase64Url(input);
    if (decodedUrl === undefined) {
      return;
    }

    try {
      return new URL(decodedUrl);
    } catch {
      return;
    }
  }
}

/**
 * Calculates schema version hash from content.
 *
 * @param content - Schema content as string.
 * @returns Schema version hash (first 8 characters of SHA-256 hash).
 */
export function calculateSchemaVersion(schema: BusinessConfigSchema): string {
  const content = stringify(schema, null, 2);
  const hashSubstringLength = 8;

  return createHash("sha256")
    .update(content)
    .digest("hex")
    .slice(0, hashSubstringLength);
}

/**
 * Validates a business configuration schema against the business config schema.
 *
 * @param value - The business configuration schema to validate.
 * @returns Validated schema as array of config schema fields.
 *
 * @throws {CommerceSdkValidationError} If the schema is invalid.
 */
export function validateBusinessConfigSchema(value: unknown) {
  return parseOrThrow(
    SchemaBusinessConfig.entries.schema,
    value,
  ) satisfies BusinessConfigSchema;
}

/**
 * Gets password field names from the schema.
 *
 * @param namespace - The namespace to get the schema from.
 * @returns Set of field names that are of type "password".
 */
export function getPasswordFields(schema: BusinessConfigSchema) {
  return new Set(
    schema
      .filter((field) => field.type === "password")
      .map((field) => field.name),
  );
}

/**
 * Filters a business configuration schema to the fields applicable to the
 * given Commerce flavor.
 *
 * Fields without an `env` property apply to all flavors and are always
 * included. Fields with an `env` array are included only when the array
 * contains the given flavor.
 *
 * @param schema - The business configuration schema to filter.
 * @param flavor - The Commerce flavor to filter by.
 * @returns The schema fields applicable to the given flavor.
 *
 * @example
 * ```ts
 * filterBusinessConfigSchemaByFlavor(schema, "saas");
 * ```
 */
export function filterBusinessConfigSchemaByFlavor(
  schema: BusinessConfigSchema,
  flavor: CommerceFlavor,
): BusinessConfigSchema {
  return schema.filter(
    (field) => field.env === undefined || field.env.includes(flavor),
  );
}

/**
 * Resolves the Commerce flavor from a runtime context object.
 *
 * Resolution order:
 * 1. `AIO_COMMERCE_API_FLAVOR` when explicitly provided as `"paas"` or `"saas"`.
 * 2. Derived from `AIO_COMMERCE_API_BASE_URL` using the Commerce SaaS URL pattern.
 *
 * @param context - Runtime context with optional Commerce-related inputs.
 * @returns The resolved flavor, or `undefined` when flavor cannot be resolved.
 */
export function resolveCommerceFlavorFromContext(
  context: CommerceFlavorContext,
): CommerceFlavor | undefined {
  if (isCommerceFlavor(context.AIO_COMMERCE_API_FLAVOR)) {
    return context.AIO_COMMERCE_API_FLAVOR;
  }

  const baseUrl = context.AIO_COMMERCE_API_BASE_URL;
  if (typeof baseUrl !== "string" || baseUrl.trim().length === 0) {
    return;
  }

  const parsedUrl = parseCommerceUrl(baseUrl);
  if (parsedUrl === undefined) {
    return;
  }

  const { hostname, pathname } = parsedUrl;
  const hostAndPath = `${hostname}${pathname}`;

  return COMMERCE_SAAS_API_URL_REGEX.test(hostAndPath) ? "saas" : "paas";
}

/**
 * Filters a business configuration schema to the fields applicable to the
 * Commerce flavor resolved from runtime context.
 *
 * When flavor cannot be resolved from context, the original schema is returned.
 *
 * @param schema - The business configuration schema to filter.
 * @param context - Runtime context with Commerce flavor/base URL inputs.
 * @returns The filtered schema when a flavor is resolved, otherwise the original schema.
 */
export function filterBusinessConfigSchemaByContext(
  schema: BusinessConfigSchema,
  context: CommerceFlavorContext,
): BusinessConfigSchema {
  const flavor = resolveCommerceFlavorFromContext(context);

  if (flavor === undefined) {
    return schema;
  }

  return filterBusinessConfigSchemaByFlavor(schema, flavor);
}
