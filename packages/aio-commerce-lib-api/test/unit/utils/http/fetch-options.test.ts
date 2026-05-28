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

import { assert, describe, expect, test, vi } from "vitest";

import { makeHttpError } from "#test/fixtures/http-error";
import { toKyOptions } from "#utils/http/fetch-options";

import type { KyRequest, KyResponse, NormalizedOptions } from "ky";

// ky v2 defines KyRequest/KyResponse as branded supertypes — cast standard Web API objects for tests.
const mockRequest = new Request("https://example.com") as unknown as KyRequest;
const mockResponse = new Response() as unknown as KyResponse;
const mockOptions = {} as NormalizedOptions;

describe("utils/http/fetch-options", () => {
  describe("toKyOptions", () => {
    test("returns options unchanged when no hooks are provided", () => {
      const result = toKyOptions({
        headers: { "X-Custom": "value" },
        timeout: 5000,
      });
      expect(result).toMatchObject({
        headers: { "X-Custom": "value" },
        timeout: 5000,
      });
      expect(result.hooks).toBeUndefined();
    });

    test("passes through non-hook options alongside wrapped hooks", () => {
      const result = toKyOptions({
        headers: { "X-Custom": "value" },
        timeout: 5000,
        hooks: { beforeRequest: [vi.fn()] },
      });
      expect(result).toMatchObject({
        headers: { "X-Custom": "value" },
        timeout: 5000,
      });
      expect(result.hooks).toBeDefined();
    });

    describe("beforeRequest adapter", () => {
      test("calls SDK hook with positional args extracted from ky state object", () => {
        const sdkHook = vi.fn();
        const result = toKyOptions({ hooks: { beforeRequest: [sdkHook] } });
        const wrappedHook = result.hooks?.beforeRequest?.[0];
        assert(wrappedHook !== undefined);

        // BeforeRequestState.retryCount is typed as literal 0 in ky v2.
        wrappedHook({
          request: mockRequest,
          options: mockOptions,
          retryCount: 0,
        });

        expect(sdkHook).toHaveBeenCalledWith(mockRequest, mockOptions, 0);
      });

      test("forwards the hook return value to ky", async () => {
        const modifiedRequest = new Request(
          "https://example.com/modified",
        ) as unknown as KyRequest;
        const sdkHook = vi.fn().mockResolvedValue(modifiedRequest);
        const result = toKyOptions({ hooks: { beforeRequest: [sdkHook] } });
        const wrappedHook = result.hooks?.beforeRequest?.[0];
        assert(wrappedHook !== undefined);

        const returnValue = await wrappedHook({
          request: mockRequest,
          options: mockOptions,
          retryCount: 0,
        });

        expect(returnValue).toBe(modifiedRequest);
      });

      test("wraps multiple hooks independently", () => {
        const hook1 = vi.fn();
        const hook2 = vi.fn();
        const result = toKyOptions({
          hooks: { beforeRequest: [hook1, hook2] },
        });

        expect(result.hooks?.beforeRequest).toHaveLength(2);

        const [wrapped1, wrapped2] = result.hooks?.beforeRequest ?? [];
        wrapped1?.({
          request: mockRequest,
          options: mockOptions,
          retryCount: 0,
        });
        wrapped2?.({
          request: mockRequest,
          options: mockOptions,
          retryCount: 0,
        });

        expect(hook1).toHaveBeenCalledOnce();
        expect(hook2).toHaveBeenCalledOnce();
      });
    });

    describe("afterResponse adapter", () => {
      test("calls SDK hook with positional args extracted from ky state object", () => {
        const sdkHook = vi.fn();
        const result = toKyOptions({ hooks: { afterResponse: [sdkHook] } });
        const wrappedHook = result.hooks?.afterResponse?.[0];
        assert(wrappedHook !== undefined);

        wrappedHook({
          request: mockRequest,
          response: mockResponse,
          options: mockOptions,
          retryCount: 1,
        });

        expect(sdkHook).toHaveBeenCalledWith(
          mockRequest,
          mockResponse,
          mockOptions,
          1,
        );
      });
    });

    describe("beforeError adapter", () => {
      test("calls SDK hook with positional args when error is an HTTPError", () => {
        const sdkHook = vi.fn((err) => err);
        const result = toKyOptions({ hooks: { beforeError: [sdkHook] } });
        const wrappedHook = result.hooks?.beforeError?.[0];
        assert(wrappedHook !== undefined);
        const error = makeHttpError(500, "Internal Server Error", "");

        wrappedHook({
          error,
          request: mockRequest,
          options: mockOptions,
          retryCount: 1,
        });

        expect(sdkHook).toHaveBeenCalledWith(
          error,
          mockRequest,
          mockOptions,
          1,
        );
      });

      test("passes error through without calling SDK hook when error is not an HTTPError", () => {
        const sdkHook = vi.fn((err) => err);
        const result = toKyOptions({ hooks: { beforeError: [sdkHook] } });
        const wrappedHook = result.hooks?.beforeError?.[0];
        assert(wrappedHook !== undefined);
        // Simulate a non-HTTPError that ky might pass in unexpected circumstances.
        const nonHttpError = new Error("plain error") as never;

        const returnValue = wrappedHook({
          error: nonHttpError,
          request: mockRequest,
          options: mockOptions,
          retryCount: 0,
        });

        expect(sdkHook).not.toHaveBeenCalled();
        expect(returnValue).toBe(nonHttpError);
      });
    });

    describe("beforeRetry adapter", () => {
      test("calls SDK hook with positional args extracted from ky state object", () => {
        const sdkHook = vi.fn();
        const result = toKyOptions({ hooks: { beforeRetry: [sdkHook] } });
        const wrappedHook = result.hooks?.beforeRetry?.[0];
        assert(wrappedHook !== undefined);
        const error = new Error("network failure");

        wrappedHook({
          request: mockRequest,
          options: mockOptions,
          error,
          retryCount: 3,
        });

        expect(sdkHook).toHaveBeenCalledWith(
          mockRequest,
          mockOptions,
          error,
          3,
        );
      });
    });
  });
});
