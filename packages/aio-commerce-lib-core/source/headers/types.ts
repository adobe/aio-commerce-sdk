/**
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

import type { CamelCase } from "type-fest";

/** The type of an HTTP header value. */
export type HttpHeaderValue = string | string[] | undefined;

/** The type of an HTTP headers record. */
export type HttpHeaders = Record<string, string | undefined>;

/** The type of an HTTP header accessor object. */
export type HttpHeaderAccessorMap<T extends string[]> = {
  [K in T[number] as CamelCase<K>]: string | string[];
};
