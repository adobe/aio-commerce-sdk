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

import { PROD_CAMS_URL } from "#commands/common/cams/config";
import { CamsHttpClient } from "#commands/common/cams/http-client";

const ORG = { id: "org-id", ims_org_id: "ims-org-id", name: "org-name" };

describe("CamsHttpClient", () => {
  test("uses the production host when the config has no base URL", () => {
    const client = new CamsHttpClient({
      auth: { getToken: async () => "token", org: ORG },
    });

    expect(client.config.baseUrl).toBe(PROD_CAMS_URL);
  });
});
