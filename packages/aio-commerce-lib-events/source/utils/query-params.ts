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
