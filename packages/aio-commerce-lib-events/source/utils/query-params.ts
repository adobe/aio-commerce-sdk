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

/**
 * Sets a query parameter if the value is truthy.
 * @param queryParams The URLSearchParams instance to set the query parameter on.
 * @param key The key of the query parameter to set.
 * @param value The value of the query parameter to set.
 */
export function setQueryParamIfTruthy(
  queryParams: URLSearchParams,
  key: string,
  value?: string | number | boolean,
) {
  if (value) {
    queryParams.set(key, `${value}`);
  }
}

/**
 * Sets an array query parameter if the values are truthy.
 * @param queryParams The URLSearchParams instance to set the query parameter on.
 * @param key The key of the query parameter to set.
 * @param values The values of the query parameter to set.
 */
export function setArrayQueryParam(
  queryParams: URLSearchParams,
  key: string,
  values?: string[] | number[] | boolean[],
) {
  if (values !== undefined && values.length > 0) {
    for (const value of values) {
      // Repeated query parameters are usually understood as arrays.
      queryParams.set(key, `${value}`);
    }
  }
}
