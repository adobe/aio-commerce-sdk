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
  createAdobeIoEventsApiClient,
  createCustomAdobeIoEventsApiClient,
  createEventProvider,
  getAllEventProviders,
} from "#io-events/index";
import { TEST_ADOBE_IO_EVENTS_HTTP_CLIENT_PARAMS } from "#test/fixtures/http-client-params";

describe("Adobe I/O Events API", () => {
  describe("createAdobeIoEventsApiClient", () => {
    test("should create an API client with all adobe i/o events endpoints", () => {
      const client = createAdobeIoEventsApiClient(
        TEST_ADOBE_IO_EVENTS_HTTP_CLIENT_PARAMS,
      );

      // Verify all expected methods are present
      expect(client).toHaveProperty("getAllEventProviders");
      expect(client).toHaveProperty("getEventProviderById");
      expect(client).toHaveProperty("createEventProvider");
      expect(client).toHaveProperty("getAllCommerceEventProviders");
      expect(client).toHaveProperty("getAll3rdPartyCustomEventProviders");
      expect(client).toHaveProperty("createCommerceEventProvider");
      expect(client).toHaveProperty("create3rdPartyCustomEventProvider");
      expect(client).toHaveProperty("getAllEventMetadataForProvider");
      expect(client).toHaveProperty("getEventMetadataForEventAndProvider");
      expect(client).toHaveProperty("createEventMetadataForProvider");
      expect(client).toHaveProperty("getAllRegistrationsByConsumerOrg");
      expect(client).toHaveProperty("getAllRegistrations");
      expect(client).toHaveProperty("getRegistrationById");
      expect(client).toHaveProperty("createRegistration");
      expect(client).toHaveProperty("updateRegistration");
      expect(client).toHaveProperty("deleteRegistration");
    });
  });

  describe("createCustomAdobeIoEventsApiClient", () => {
    test("should create an API client with only specified endpoints", () => {
      const customFunctions = {
        getAllEventProviders,
        createEventProvider,
      };

      const client = createCustomAdobeIoEventsApiClient(
        TEST_ADOBE_IO_EVENTS_HTTP_CLIENT_PARAMS,
        customFunctions,
      );

      expect(client).toHaveProperty("getAllEventProviders");
      expect(client).toHaveProperty("createEventProvider");

      expect(client).not.toHaveProperty("createCommerceEventProvider");
      expect(client).not.toHaveProperty("getEventMetadataForEventAndProvider");
    });
  });
});
