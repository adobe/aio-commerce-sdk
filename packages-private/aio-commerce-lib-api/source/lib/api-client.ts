import type { HttpClientBase } from "./http-client-base";

/** A function that takes an object of HTTP clients and returns something. */
export type ApiFunction<
  TClient extends HttpClientBase<unknown>,
  TArgs extends unknown[],
  TResult,
> = (clients: TClient, ...args: TArgs) => TResult;

/** A client that bounds a set of {@link ApiFunction} to their HTTP clients. */
export type ApiClientRecord<
  TClient extends HttpClientBase<unknown>,
  TFunctions extends Record<string, ApiFunction<TClient, unknown[], unknown>>,
> = {
  [K in keyof TFunctions]: TFunctions[K] extends ApiFunction<
    TClient,
    infer Args,
    infer Result
  >
    ? (...args: Args) => Result
    : never;
};

// biome-ignore lint/complexity/noStaticOnlyClass: For consistency with the rest of the codebase.
export class ApiClient {
  public static create<
    TClient extends HttpClientBase<unknown>,
    // biome-ignore lint/suspicious/noExplicitAny: We can't know the type of the argument/return type.
    TFunctions extends Record<string, ApiFunction<TClient, any[], any>>,
  >(client: TClient, functions: TFunctions) {
    const wrapped = {} as ApiClientRecord<TClient, TFunctions>;

    for (const key in functions) {
      if (Object.hasOwn(functions, key)) {
        const fn = functions[key];
        // biome-ignore lint/suspicious/noExplicitAny: We can't know the type of the argument/return type.
        wrapped[key] = ((...args: unknown[]) => fn(client, ...args)) as any;
      }
    }

    return wrapped;
  }
}
