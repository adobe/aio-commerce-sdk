/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import type {
  PaaSClientParams,
  SaaSClientParams,
} from "@adobe/aio-commerce-lib-api";

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
