import type { HttpClientBase } from "./http-client-base";

/** A function that takes an object of HTTP clients and returns something. */
type ApiFunction<
  TClients extends Record<string, HttpClientBase<unknown>>,
  TArgs extends unknown[],
  TResult,
> = (clients: TClients, ...args: TArgs) => TResult;

/** A client that bounds a set of {@link ApiFunction} to their HTTP clients. */
type ApiClientRecord<
  TClients extends Record<string, HttpClientBase<unknown>>,
  TFunctions extends Record<string, ApiFunction<TClients, unknown[], unknown>>,
> = {
  [K in keyof TFunctions]: TFunctions[K] extends ApiFunction<
    TClients,
    infer Args,
    infer Result
  >
    ? (...args: Args) => Result
    : never;
};

// biome-ignore lint/complexity/noStaticOnlyClass: For consistency with the rest of the codebase.
export class ApiClient {
  public static create<
    TClients extends Record<string, HttpClientBase<unknown>>,
    // biome-ignore lint/suspicious/noExplicitAny: We can't know the type of the argument/return type.
    TFunctions extends Record<string, ApiFunction<TClients, any[], any>>,
  >(clients: TClients, functions: TFunctions) {
    const wrapped = {} as ApiClientRecord<TClients, TFunctions>;

    for (const key in functions) {
      if (Object.hasOwn(functions, key)) {
        const fn = functions[key];
        // biome-ignore lint/suspicious/noExplicitAny: We can't know the type of the argument/return type.
        wrapped[key] = ((...args: unknown[]) => fn(clients, ...args)) as any;
      }
    }

    return wrapped;
  }
}
