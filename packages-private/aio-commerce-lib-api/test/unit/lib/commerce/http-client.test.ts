/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { describe, expect, it } from "vitest";

import { AdobeCommerceHttpClient } from "#lib/commerce/http-client";
import { TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_PAAS } from "#test/fixtures/http-clients";
import { libApiTestSetup } from "#test/setup";

import type { KyInstance } from "ky";
import type { CommerceHttpClientParams } from "#lib/commerce/types";

class TestAdobeCommerceHttpClient extends AdobeCommerceHttpClient {
  public constructor(params: CommerceHttpClientParams, kyInstance: KyInstance) {
    super(params);
    this.setHttpClient(kyInstance);
  }
}

describe("lib/commerce/http-client", () => {
  const context = libApiTestSetup(
    TestAdobeCommerceHttpClient,
    TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_PAAS,
  );

  describe("constructor and properties", () => {
    it("should create a new Commerce HTTP client instance", () => {
      const { clientConfig } = context;
      expect(clientConfig.flavor).toBe("paas");
    });
  });
});
