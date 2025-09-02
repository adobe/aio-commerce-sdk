import type {
  ImsAuthProvider,
  IntegrationAuthParams,
  IntegrationAuthProvider,
} from "@adobe/aio-commerce-lib-auth";
import type { Options } from "ky";
import type { ImsAuthParamsWithOptionalScopes } from "#utils/auth/ims-scopes";

type CommerceHttpClientConfigBase = {
  /** The base URL of the Commerce API. */
  baseUrl: string;

  /**
   * The store view code use to make requests to the Commerce API.
   * @default "all"
   */
  storeViewCode?: string;

  /**
   * The version of the Commerce API to use. Currently only `v1` is supported.
   * @default "V1"
   */
  version?: "V1";
};

/** Defines the configuration required to build an Adobe Commerce HTTP client for PaaS. */
export type CommerceHttpClientConfigPaaS = CommerceHttpClientConfigBase & {
  /** The flavor of the Commerce instance. */
  flavor: "paas";
};

/** Defines the configuration required to build an Adobe Commerce HTTP client for SaaS. */
export type CommerceHttpClientConfigSaaS = CommerceHttpClientConfigBase & {
  /** The flavor of the Commerce instance. */
  flavor: "saas";
};

/** Defines the configuration required to build an Adobe Commerce HTTP client. */
export type CommerceHttpClientConfig =
  | CommerceHttpClientConfigPaaS
  | CommerceHttpClientConfigSaaS;

/** Defines the flavor of a Commerce instance. */
export type CommerceFlavor = CommerceHttpClientConfig["flavor"];

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
