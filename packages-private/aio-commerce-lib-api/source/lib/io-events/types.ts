import type { ImsAuthProvider } from "@adobe/aio-commerce-lib-auth";
import type { Options } from "ky";
import type { ImsAuthParamsWithOptionalScopes } from "#utils/auth/ims-scopes";

/** Defines the configuration required to build an Adobe I/O HTTP client. */
export type IoEventsHttpClientConfig = {
  /**
   * The base URL to use for the Adobe I/O Events API.
   * @default "https://api.adobe.io/events"
   */
  baseUrl?: string;
};

/** Defines the parameters required to build an HTTP client for the Adobe I/O Events API. */
export type IoEventsHttpClientParams = {
  /** The IMS authentication parameters. */
  auth: ImsAuthProvider | ImsAuthParamsWithOptionalScopes;

  /** The configuration for the I/O Events HTTP client. */
  config: IoEventsHttpClientConfig;

  /** Additional fetch options to use for the I/O Events HTTP requests. */
  fetchOptions?: Options;
};
