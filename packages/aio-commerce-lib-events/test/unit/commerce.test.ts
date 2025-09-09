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

import { describe, expect, test } from "vitest";

import {
  createCommerceEventsApiClient,
  createCustomCommerceEventsApiClient,
  createEventProvider,
  getAllEventProviders,
} from "#commerce/index";
import { TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_PAAS } from "#test/fixtures/http-client-params";

describe("Commerce Events API", () => {
  describe("createCommerceEventsApiClient", () => {
    test("should create an API client with all commerce events endpoints", () => {
      const client = createCommerceEventsApiClient(
        // Either PaaS or SaaS, doesn't matter for what we're testing here.
        TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_PAAS,
      );

      // Verify all expected methods are present
      expect(client).toHaveProperty("getAllEventProviders");
      expect(client).toHaveProperty("getEventProviderById");
      expect(client).toHaveProperty("createEventProvider");
      expect(client).toHaveProperty("getAllEventSubscriptions");
      expect(client).toHaveProperty("createEventSubscription");
      expect(client).toHaveProperty("updateEventingConfiguration");
    });
  });

  describe("createCustomCommerceEventsApiClient", () => {
    test("should create an API client with only specified endpoints", () => {
      const customFunctions = {
        getAllEventProviders,
        createEventProvider,
      };

      const client = createCustomCommerceEventsApiClient(
        TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_PAAS,
        customFunctions,
      );

      expect(client).toHaveProperty("getAllEventProviders");
      expect(client).toHaveProperty("createEventProvider");

      expect(client).not.toHaveProperty("getAllEventSubscriptions");
      expect(client).not.toHaveProperty("updateEventingConfiguration");
    });
  });
});
