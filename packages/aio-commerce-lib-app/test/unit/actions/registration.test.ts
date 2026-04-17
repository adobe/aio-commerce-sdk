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

import { registrationRuntimeAction } from "#actions/registration";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";

const mockParams = {
  __ow_method: "GET",
  __ow_path: "/",
  __ow_headers: {},
  LOG_LEVEL: "debug",
} as unknown as RuntimeActionParams;

describe("registrationRuntimeAction", () => {
  test("the factory returns a function", () => {
    const handler = registrationRuntimeAction({ registration: {} });
    expect(typeof handler).toBe("function");
  });

  test("when called with a registration object, the handler returns it in the body", async () => {
    const registration = { menuItems: [{ id: "test::item", title: "Item" }] };
    const handler = registrationRuntimeAction({ registration });
    const result = await handler(mockParams);

    expect(result).toMatchObject({
      type: "success",
      statusCode: 200,
      body: { registration },
    });
  });

  test("when called with an empty registration, the handler returns 200", async () => {
    const registration = {};
    const handler = registrationRuntimeAction({ registration });
    const result = await handler(mockParams);

    expect(result).toMatchObject({
      type: "success",
      statusCode: 200,
      body: { registration },
    });
  });
});
