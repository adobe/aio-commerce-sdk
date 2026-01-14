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

import { describe, expect, test } from "vitest";

import {
  createAdobeIoApiClient,
  createCustomAdobeIoApiClient,
  downloadWorkspaceJson,
} from "#io-console/index";
import { TEST_ADOBE_IO_EVENTS_HTTP_CLIENT_PARAMS } from "#test/fixtures/http-client-params";

describe("Adobe I/O Console API", () => {
  describe("createAdobeIoEventsApiClient", () => {
    test("should create an API client with all adobe i/o events endpoints", () => {
      const client = createAdobeIoApiClient(
        TEST_ADOBE_IO_EVENTS_HTTP_CLIENT_PARAMS,
      );

      // Verify all expected methods are present
      expect(client).toHaveProperty("downloadWorkspaceJson");
    });
  });
  describe("createCustomAdobeIoApiClient", () => {
    test("should create an API client with only specified endpoints", () => {
      const customFunctions = {
        downloadWorkspaceJson,
      };

      const client = createCustomAdobeIoApiClient(
        TEST_ADOBE_IO_EVENTS_HTTP_CLIENT_PARAMS,
        customFunctions,
      );

      expect(client).toHaveProperty("downloadWorkspaceJson");
      expect(client).not.toHaveProperty("unknownEndpoint");
    });
  });
});
