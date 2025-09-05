import { AdobeCommerceHttpClient } from "#lib/commerce/http-client";
import { HttpClientBase } from "#lib/http-client-base";

import type { KyInstance } from "ky";
import type {
  CommerceHttpClientParams,
  PaaSClientParams,
  SaaSClientParams,
} from "#lib/commerce/types";

export type TestHttpClientConfig = {
  apiKey: string;
  baseUrl: string;
};

export type TestHttpClientParams = {
  config: TestHttpClientConfig;
};

export class TestHttpClient extends HttpClientBase<TestHttpClientConfig> {
  public constructor(params: TestHttpClientParams, kyInstance: KyInstance) {
    super(params.config, kyInstance);
  }
}

export class TestAdobeCommerceHttpClient extends AdobeCommerceHttpClient {
  public constructor(params: CommerceHttpClientParams, kyInstance: KyInstance) {
    super(params);
    this.setHttpClient(kyInstance);
  }
}

// Default config for the test HTTP client.
export const TEST_HTTP_CLIENT_PARAMS: TestHttpClientParams = {
  config: {
    apiKey: "test-api-key",
    baseUrl: "https://api.example.com",
  },
};

// Default config for the test Adobe Commerce HTTP client for PaaS.
export const TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_PAAS: PaaSClientParams = {
  config: {
    baseUrl: "https://api.commerce.adobe.com",
    flavor: "paas",
  },

  auth: {
    accessToken: "test-access-token",
    accessTokenSecret: "test-access-token-secret",
    consumerKey: "test-consumer-key",
    consumerSecret: "test-consumer-secret",
  },
};

// Default config for the test Adobe Commerce HTTP client for SaaS.
export const TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_SAAS: SaaSClientParams = {
  config: {
    baseUrl: "https://api.commerce.adobe.com",
    flavor: "saas",
  },

  auth: {
    clientId: "test-client-id",
    clientSecrets: ["test-client-secret"],
    technicalAccountId: "test-technical-account-id",
    technicalAccountEmail: "test-technical-account-email",
    imsOrgId: "test-ims-org-id",
    environment: "prod",
  },
};
