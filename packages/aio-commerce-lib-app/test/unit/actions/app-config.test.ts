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

import { appConfigRuntimeAction } from "#actions/app-config";
import { createRuntimeActionParams } from "#test/fixtures/actions";
import { minimalValidConfig } from "#test/fixtures/config";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

describe("appConfigRuntimeAction", () => {
  test("returns the validated app config for GET /", async () => {
    const handler = appConfigRuntimeAction({
      appConfig: minimalValidConfig,
    });

    const result = await handler(createRuntimeActionParams());

    expect(result).toEqual({
      type: "success",
      statusCode: 200,
      body: minimalValidConfig,
    });
  });

  test("returns a 500 error when the app config is invalid", async () => {
    const handler = appConfigRuntimeAction({
      appConfig: {} as unknown as CommerceAppConfigOutputModel,
    });

    const result = await handler(createRuntimeActionParams());

    expect(result).toMatchObject({
      type: "error",
      error: {
        statusCode: 500,
        body: {
          message: "Internal server error",
          error: "Invalid commerce app config",
        },
      },
    });
  });
});
