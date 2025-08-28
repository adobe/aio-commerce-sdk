import type {
  ImsAuthProvider,
  IntegrationAuthParams,
  IntegrationAuthProvider,
} from "@adobe/aio-commerce-lib-auth";
import type { KyInstance, Options } from "ky";
import type { ImsAuthParamsWithOptionalScopes } from "~/utils/auth/ims-scopes";

/** Defines the flavor of the Commerce instance. */
export type CommerceFlavor = "paas" | "saas";

/** Defines the configuration required to build an Adobe Commerce HTTP client. */
export type CommerceHttpClientConfig = {
  /** The base URL of the Commerce API. */
  baseUrl: string;

  /** Whether the target Commerce instance is a PaaS or SaaS. */
  flavor: CommerceFlavor;

  /**
   * The store view code use to make requests to the Commerce API.
   * @default "all"
   */
  storeViewCode?: string;

  /**
   * The version of the Commerce API to use. Currently only `v1` is supported.
   * @default "v1"
   */
  version?: "v1";
};

/** Defines the configuration required to build an Adobe Commerce HTTP client for PaaS. */
export type CommerceHttpClientConfigPaaS = CommerceHttpClientConfig & {
  flavor: "paas";
};

/** Defines the configuration required to build an Adobe Commerce HTTP client for SaaS. */
export type CommerceHttpClientConfigSaaS = CommerceHttpClientConfig & {
  flavor: "saas";
};

// Type for SaaS configuration
export type SaaSClientParams = {
  auth: ImsAuthProvider | ImsAuthParamsWithOptionalScopes; // We provide default scopes.
  config: CommerceHttpClientConfigSaaS;
  fetchOptions?: Options;
};

// Type for PaaS configuration
export type PaaSClientParams = {
  auth: IntegrationAuthProvider | IntegrationAuthParams;
  config: CommerceHttpClientConfigPaaS;
  fetchOptions?: Options;
};

// Discriminated union of both types
export type CommerceHttpClientParams = SaaSClientParams | PaaSClientParams;

/** Defines a {@link KyInstance} which targets an Adobe Commerce instance. */
export type CommerceHttpClient = KyInstance & {
  config: CommerceHttpClientConfig;
};
