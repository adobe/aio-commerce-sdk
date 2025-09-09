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
