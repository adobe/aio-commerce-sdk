import type { KyInstance, Options } from "ky";

type KyHttpClient = Omit<KyInstance, "extend" | "create">;

/**
 * Base class for HTTP clients.
 * @template T The type of the configuration object.
 */
export class HttpClientBase<T> implements KyHttpClient {
  /** The actual HTTP client instance. */
  readonly #httpClient: Readonly<KyInstance>;

  /** The configuration used by the HTTP client. */
  public readonly config: Readonly<T>;

  public readonly get: KyInstance["get"];
  public readonly post: KyInstance["post"];
  public readonly put: KyInstance["put"];
  public readonly delete: KyInstance["delete"];
  public readonly patch: KyInstance["patch"];
  public readonly head: KyInstance["head"];
  public readonly stop: KyInstance["stop"];

  /**
   * Creates a new HTTP client instance.
   * @param config The configuration used by the HTTP client.
   * @param httpClient The actual HTTP client instance.
   */
  protected constructor(config: T, httpClient: KyInstance) {
    this.#httpClient = Object.freeze(httpClient);
    this.config = Object.freeze(config);

    this.get = this.#httpClient.get.bind(this.#httpClient);
    this.post = this.#httpClient.post.bind(this.#httpClient);
    this.put = this.#httpClient.put.bind(this.#httpClient);
    this.delete = this.#httpClient.delete.bind(this.#httpClient);
    this.patch = this.#httpClient.patch.bind(this.#httpClient);
    this.head = this.#httpClient.head.bind(this.#httpClient);
    this.stop = this.#httpClient.stop;
  }

  /**
   * Extends the current HTTP client instance with the given options.
   * @param options The options to extend the HTTP client with.
   */
  public extend(options: Options | ((parentOptions: Options) => Options)) {
    const client = Object.freeze(this.#httpClient.extend(options));
    return new HttpClientBase(this.config, client);
  }
}
