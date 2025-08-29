import type { KyInstance, Options } from "ky";

/**
 * Base class for HTTP clients.
 * @template T The type of the configuration object.
 */
export class HttpClientBase<T> {
  /** The actual HTTP client instance. */
  // biome-ignore lint/style/useReadonlyClassProperties: False positive
  #httpClient: Readonly<KyInstance>;

  /** The configuration used by the HTTP client. */
  public readonly config: Readonly<T>;

  /** Creates a new HTTP client instance. */
  protected constructor(config: T, httpClient: KyInstance) {
    this.#httpClient = Object.freeze(httpClient);
    this.config = Object.freeze(config);
  }

  /**
   * Merges the given HTTP client with the current instance.
   * @param client The Ky HTTP client to merge with the current instance.
   */
  protected static merge(
    base: HttpClientBase<unknown>,
    client: KyInstance | Readonly<KyInstance>,
  ) {
    const { extend: _, ...rest } = client;
    return Object.assign(base, rest as Omit<KyInstance, "extend">);
  }

  /**
   * Creates a new HTTP client instance.
   * @param params The parameters for building the HTTP client.
   */
  public extend(options: Options | ((parentOptions: Options) => Options)) {
    const client = Object.freeze(this.#httpClient.extend(options));
    const instance = new HttpClientBase(this.config, client);

    return HttpClientBase.merge(instance, client);
  }
}
