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

/** biome-ignore-all lint/performance/noBarrelFile: This is the entrypoint of the package API */

export { ApiClient } from "./lib/api-client";
export { resolveCommerceHttpClientParams } from "./lib/commerce/helpers";
export { AdobeCommerceHttpClient } from "./lib/commerce/http-client";
export { searchCriteria } from "./lib/commerce/search-criteria/builder";
export {
  buildSearchCriteria,
  buildSearchCriteriaRecord,
} from "./lib/commerce/search-criteria/serialize";
export { resolveIoEventsHttpClientParams } from "./lib/io-events/helpers";
export { AdobeIoEventsHttpClient } from "./lib/io-events/http-client";

export type { ApiClientRecord, ApiFunction } from "./lib/api-client";
export type { SearchCriteriaBuilder } from "./lib/commerce/search-criteria/builder";
export type * from "./lib/commerce/search-criteria/types";
export type * from "./lib/commerce/types";
export type * from "./lib/io-events/types";
