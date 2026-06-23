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

import { beforeEach, describe, expect, test, vi } from "vitest";

const { mockSetAssociationData, mockClearAssociationData } = vi.hoisted(() => ({
  mockSetAssociationData: vi.fn(),
  mockClearAssociationData: vi.fn(),
}));

vi.mock("#management/association/association-repository", () => ({
  setAssociationData: mockSetAssociationData,
  clearAssociationData: mockClearAssociationData,
}));

import { associationRuntimeAction } from "#actions/association/index";
import { createRuntimeActionParams } from "#test/fixtures/actions";

describe("associationRuntimeAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /", () => {
    test("stores valid association data and returns 204", async () => {
      const action = associationRuntimeAction();
      const params = createRuntimeActionParams({
        method: "post",
        path: "/",
        body: {
          commerceBaseUrl: "https://example.com",
          commerceEnv: "paas",
        },
      });

      const result = await action(params);

      expect(mockSetAssociationData).toHaveBeenCalledWith({
        baseUrl: "https://example.com",
        env: "paas",
      });
      expect(result).toMatchObject({
        type: "success",
        statusCode: 204,
      });
    });

    test("accepts saas as a valid env", async () => {
      const action = associationRuntimeAction();
      const params = createRuntimeActionParams({
        method: "post",
        path: "/",
        body: {
          commerceBaseUrl: "https://saas.example.com",
          commerceEnv: "saas",
        },
      });

      const result = await action(params);

      expect(mockSetAssociationData).toHaveBeenCalledWith({
        baseUrl: "https://saas.example.com",
        env: "saas",
      });
      expect(result).toMatchObject({
        type: "success",
        statusCode: 204,
      });
    });

    test("returns 400 for invalid env values", async () => {
      const action = associationRuntimeAction();
      const params = createRuntimeActionParams({
        method: "post",
        path: "/",
        body: {
          commerceBaseUrl: "https://example.com",
          commerceEnv: "invalid",
        },
      });

      const result = await action(params);

      expect(result).toMatchObject({
        type: "error",
        error: { statusCode: 400 },
      });
      expect(mockSetAssociationData).not.toHaveBeenCalled();
    });

    test("returns 400 when commerceBaseUrl is not a valid URL", async () => {
      const action = associationRuntimeAction();
      const params = createRuntimeActionParams({
        method: "post",
        path: "/",
        body: {
          commerceBaseUrl: "not-a-url",
          commerceEnv: "paas",
        },
      });

      const result = await action(params);

      expect(result).toMatchObject({
        type: "error",
        error: { statusCode: 400 },
      });
      expect(mockSetAssociationData).not.toHaveBeenCalled();
    });

    test("returns 400 when the body is missing required fields", async () => {
      const action = associationRuntimeAction();
      const params = createRuntimeActionParams({
        method: "post",
        path: "/",
        body: {
          commerceBaseUrl: "https://example.com",
        },
      });

      const result = await action(params);

      expect(result).toMatchObject({
        type: "error",
        error: { statusCode: 400 },
      });
      expect(mockSetAssociationData).not.toHaveBeenCalled();
    });

    test("returns 500 when the storage write fails", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      mockSetAssociationData.mockRejectedValueOnce(new Error("storage down"));

      const action = associationRuntimeAction();
      const params = createRuntimeActionParams({
        method: "post",
        path: "/",
        body: {
          commerceBaseUrl: "https://example.com",
          commerceEnv: "paas",
        },
      });

      const result = await action(params);

      expect(result).toMatchObject({
        type: "error",
        error: { statusCode: 500 },
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("DELETE /", () => {
    test("clears the stored data and returns 204", async () => {
      const action = associationRuntimeAction();
      const params = createRuntimeActionParams({
        method: "delete",
        path: "/",
      });

      const result = await action(params);

      expect(mockClearAssociationData).toHaveBeenCalledOnce();
      expect(result).toMatchObject({
        type: "success",
        statusCode: 204,
      });
    });

    test("returns 500 when clearing the stored data fails", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      mockClearAssociationData.mockRejectedValueOnce(new Error("storage down"));

      const action = associationRuntimeAction();
      const params = createRuntimeActionParams({
        method: "delete",
        path: "/",
      });

      const result = await action(params);

      expect(result).toMatchObject({
        type: "error",
        error: { statusCode: 500 },
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
