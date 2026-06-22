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

import { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
import { HttpResponse, http } from "msw";

import type {
  AdminUiExtensionConfig,
  AdminUiExtensionState,
} from "../../source/admin-ui/types";

const BASE = "https://commerce.test/V1";

export const adminUiFixtures = {
  client: new AdobeCommerceHttpClient({
    config: { baseUrl: "https://commerce.test/", flavor: "saas" },
    auth: {
      getAccessToken: async () => "test-token",
      getHeaders: async () => ({ Authorization: "Bearer test-token" }),
    },
  }),

  desired: {
    extension: {
      extensionName: "myExtension",
      extensionTitle: "My Extension",
      extensionUrl: "https://example.com/admin-ui",
      extensionWorkspace: "production",
    } satisfies AdminUiExtensionConfig,
  },
  state: {
    extension: {
      extensionId: "ext-id-abc",
      extensionName: "myExtension",
      extensionWorkspace: "production",
      extensionUrl: "https://example.com/admin-ui",
      extensionTitle: "My Extension",
    } satisfies AdminUiExtensionState,
  },
};

export const adminUiHandlers = {
  register: [
    http.post(`${BASE}/adminuisdk/extension`, () =>
      HttpResponse.json({ extensionId: "ext-id-abc" }),
    ),
  ],
  unregister: [
    http.delete(
      `${BASE}/adminuisdk/extension/production/myExtension`,
      () => new HttpResponse(null, { status: 204 }),
    ),
  ],
};
