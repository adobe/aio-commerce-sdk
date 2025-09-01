import type { KyInstance, Options } from "ky";

/**
 * Base class for HTTP clients.
 * @template T The type of the configuration object.
 */
// @ts-expect-error The interface is not explicitly implemented because
// we forward all of it's methods via the inner KyInstance (with Object.assign).
export class HttpClientBase<T> implements Omit<KyInstance, "extend"> {
  /** The actual HTTP client instance. */
  readonly #httpClient: Readonly<KyInstance>;

  /** The configuration used by the HTTP client. */
  public readonly config: Readonly<T>;

  /**
   * Creates a new HTTP client instance.
   * @param config The configuration used by the HTTP client.
   * @param httpClient The actual HTTP client instance.
   */
  protected constructor(config: T, httpClient: KyInstance) {
    this.#httpClient = Object.freeze(httpClient);
    this.config = Object.freeze(config);
  }

  /**
   * Merges the given HTTP client with the given target instance.
   * @param base The target instance to merge with.
   * @param client The Ky HTTP client to merge with the target instance.
   */
  protected static merge<TClient extends HttpClientBase<unknown>>(
    base: TClient,
    client: KyInstance | Readonly<KyInstance>,
  ) {
    const { extend: _, ...rest } = client;
    return Object.assign(base, rest as Omit<KyInstance, "extend">);
  }

  /**
   * Extends the current HTTP client instance with the given options.
   * @param options The options to extend the HTTP client with.
   */
  public extend(options: Options | ((parentOptions: Options) => Options)) {
    const client = Object.freeze(this.#httpClient.extend(options));
    const instance = new HttpClientBase(this.config, client);

    return HttpClientBase.merge(instance, client);
  }
}
