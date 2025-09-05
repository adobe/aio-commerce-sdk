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
  TEST_HTTP_CLIENT_CONFIG,
  TestHttpClient,
} from "#test/fixtures/http-clients";
import {
  buildCamelCaseKeysHookFetchOptions,
  buildUppercaseKeysHookFetchOptions,
} from "#test/fixtures/ky-options";
import { libApiTestSetup } from "#test/setup";

describe("utils/transformations", () => {
  const context = libApiTestSetup(TestHttpClient, TEST_HTTP_CLIENT_CONFIG);

  describe("hooks/buildObjectKeyTransformerResponseHook", () => {
    test("should transform the keys of an object", async () => {
      const { testClient, fetchMock } = context;
      fetchMock.mockResolvedValueOnce(
        Response.json({ test: "test", test2: "test2" }),
      );

      const fetchOptions = buildUppercaseKeysHookFetchOptions();
      const response = await testClient.get("test", fetchOptions).json();
      expect(response).toEqual({
        TEST: "test",
        TEST2: "test2",
      });
    });

    test("should transform the keys of an object recursively", async () => {
      const { testClient, fetchMock } = context;
      fetchMock.mockResolvedValueOnce(
        Response.json({ test: { test2: { test3: "test3" } } }),
      );

      const fetchOptions = buildUppercaseKeysHookFetchOptions();
      const response = await testClient.get("test", fetchOptions).json();
      expect(response).toEqual({
        TEST: {
          TEST2: {
            TEST3: "test3",
          },
        },
      });
    });

    test("should transform keys of objects inside an array", async () => {
      const { testClient, fetchMock } = context;
      fetchMock.mockResolvedValueOnce(
        Response.json({ test: [{ test2: "test2" }, "some-value"] }),
      );

      const fetchOptions = buildUppercaseKeysHookFetchOptions();
      const response = await testClient.get("test", fetchOptions).json();
      expect(response).toEqual({
        TEST: [
          {
            TEST2: "test2",
          },
          "some-value",
        ],
      });
    });
  });

  test("should not transform the keys of a nested object if the recursive option is false", async () => {
    const { testClient, fetchMock } = context;
    fetchMock.mockResolvedValueOnce(
      Response.json({ test: { test2: { test3: "test3" } } }),
    );

    const fetchOptions = buildUppercaseKeysHookFetchOptions(false);
    const response = await testClient.get("test", fetchOptions).json();
    expect(response).toEqual({
      TEST: {
        test2: {
          test3: "test3",
        },
      },
    });
  });

  test("should not transform the keys of objects in array if the recursive option is false", async () => {
    const { testClient, fetchMock } = context;
    fetchMock.mockResolvedValueOnce(Response.json([{ test2: "test2" }]));

    const fetchOptions = buildUppercaseKeysHookFetchOptions(false);
    const response = await testClient.get("test", fetchOptions).json();
    expect(response).toEqual([
      {
        test2: "test2",
      },
    ]);
  });

  describe("hooks/buildCamelCaseKeysResponseHook", () => {
    test("should transform the keys of an object to camel case", async () => {
      const { testClient, fetchMock } = context;
      fetchMock.mockResolvedValueOnce(
        Response.json({
          test_snake: "test",
          _underscore_prefix: "test2",
          testCamelCase: "test3",
          "kebab-case": "test4",
        }),
      );

      const fetchOptions = buildCamelCaseKeysHookFetchOptions();
      const response = await testClient.get("test", fetchOptions).json();
      expect(response).toEqual({
        testSnake: "test",
        underscorePrefix: "test2",
        testCamelCase: "test3",
        kebabCase: "test4",
      });
    });
  });
});
