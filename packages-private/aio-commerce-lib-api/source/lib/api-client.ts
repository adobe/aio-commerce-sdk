import type { KyInstance } from "ky";

/**
 * Defines an API function. This is a function that takes an
 * HTTP client and some arguments and returns a result.
 */
type ApiFunction<
  TClient extends KyInstance,
  TArgs extends unknown[],
  TResult,
> = (client: TClient, ...args: TArgs) => TResult;

/**
 * Defines an API client. This is a client that wraps an HTTP client and
 * provides a set of functions that can be used to make requests to the API.
 */
type ApiClient<
  TClient extends KyInstance,
  T extends Record<string, ApiFunction<TClient, unknown[], unknown>>,
> = {
  [K in keyof T]: (
    ...args: Parameters<T[K]> extends [unknown, ...infer Rest] ? Rest : never
  ) => ReturnType<T[K]>;
};

/**
 * Creates an API client for the given HTTP client and functions.
 * @param client The HTTP client.
 * @param fns The functions to wrap.
 */
export function buildApiClient<
  TClient extends KyInstance,
  // biome-ignore lint/suspicious/noExplicitAny: We can't know the type of the arguments here.
  T extends Record<string, ApiFunction<TClient, any[], any>>,
>(client: TClient, fns: T): ApiClient<TClient, T> {
  const wrapped = {} as ApiClient<TClient, T>;

  for (const key in fns) {
    if (Object.hasOwn(fns, key)) {
      wrapped[key] = (...args: unknown[]) => fns[key](client, ...args);
    }
  }

  return wrapped;
}
