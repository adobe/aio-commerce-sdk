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

/** biome-ignore-all lint/performance/noBarrelFile: export as part of the Public API */

/**
 * This module exports core HTTP header utilities for the AIO Commerce SDK.
 * @packageDocumentation
 */

export { createHeaderAccessor } from "./accessor";
export {
  isBasicAuth,
  isBearerAuth,
  isOAuth,
  parseAuthorization,
  parseBasicToken,
  parseBearerToken,
  parseOAuthToken,
} from "./auth";
export { getHeader, getHeadersFromParams } from "./helpers";
export {
  assertRequiredHeaders,
  assertRequiredHeadersSchema,
  getMissingOrEmptyHeaders,
} from "./validation";

export type {
  Authorization,
  BasicAuthorization,
  BearerAuthorization,
  GenericAuthorization,
  OAuth1Authorization,
  OAuth1Parameters,
} from "./auth";
export type {
  HttpHeaderAccessorMap,
  HttpHeaders,
  HttpHeaderValue,
} from "./types";
