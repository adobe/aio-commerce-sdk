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
  mockClearAssociationData: vi.fn(),
  mockSetAssociationData: vi.fn(),
}));

const { mockEnsureAdopted, mockCreateCamsClient } = vi.hoisted(() => {
  const ensureAdopted = vi.fn();
  return {
    mockCreateCamsClient: vi.fn(() => ({
      ensureAdopted,
      patchConfig: vi.fn(),
      postStatus: vi.fn(),
    })),
    mockEnsureAdopted: ensureAdopted,
  };
});

vi.mock("#management/association/repository", () => ({
  clearAssociationData: mockClearAssociationData,
  setAssociationData: mockSetAssociationData,
}));

vi.mock("@adobe/aio-commerce-lib-auth", () => ({
  getImsAuthProvider: vi.fn(() => ({
    getAccessToken: vi.fn(),
    getHeaders: vi.fn(),
  })),
  resolveImsAuthParams: vi.fn(() => ({
    clientId: "client-1",
    clientSecrets: ["secret"],
    imsOrgId: "org@AdobeOrg",
    scopes: ["scope"],
    technicalAccountEmail: "tech@example.com",
    technicalAccountId: "tech-1",
  })),
}));

vi.mock("#management/cams/index", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#management/cams/index")>();
  return {
    ...actual,
    createCamsClient: mockCreateCamsClient,
    resolveCamsBaseUrl: vi.fn(() => "https://cams.test"),
  };
});

import { associationRuntimeAction } from "#actions/association/index";
import {
  CamsAdoptConflictError,
  CamsRecordNotFoundError,
  CamsUnavailableError,
} from "#management/cams/errors";
import { createRuntimeActionParams } from "#test/fixtures/actions";

const VALID_BODY = {
  commerceBaseUrl: "https://example.com",
  commerceEnv: "paas",
  commerceId: "commerce-1",
  extId: "ext-1",
  workspaceId: "workspace-1",
};

describe("associationRuntimeAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnsureAdopted.mockResolvedValue("record-1");
  });

  describe("POST /", () => {
    test("adopts, stores valid association data and returns 204", async () => {
      const action = associationRuntimeAction();
      const params = createRuntimeActionParams({
        body: VALID_BODY,
        method: "post",
        path: "/",
      });

      const result = await action(params);

      expect(mockCreateCamsClient).toHaveBeenCalledWith(
        expect.objectContaining({
          baseUrl: "https://cams.test",
          identity: {
            commerceId: "commerce-1",
            extId: "ext-1",
            workspaceId: "workspace-1",
          },
        }),
      );
      expect(mockEnsureAdopted).toHaveBeenCalledOnce();
      expect(mockSetAssociationData).toHaveBeenCalledWith({
        commerce: { baseUrl: "https://example.com", env: "paas" },
      });
      expect(result).toMatchObject({ statusCode: 204, type: "success" });
    });

    test("accepts saas as a valid env", async () => {
      const action = associationRuntimeAction();
      const params = createRuntimeActionParams({
        body: {
          ...VALID_BODY,
          commerceBaseUrl: "https://saas.example.com",
          commerceEnv: "saas",
        },
        method: "post",
        path: "/",
      });

      const result = await action(params);

      expect(mockSetAssociationData).toHaveBeenCalledWith({
        commerce: { baseUrl: "https://saas.example.com", env: "saas" },
      });
      expect(result).toMatchObject({ statusCode: 204, type: "success" });
    });

    test("still associates (204) when the record is not found yet", async () => {
      mockEnsureAdopted.mockRejectedValueOnce(new CamsRecordNotFoundError());

      const action = associationRuntimeAction();
      const params = createRuntimeActionParams({
        body: VALID_BODY,
        method: "post",
        path: "/",
      });

      const result = await action(params);

      expect(mockSetAssociationData).toHaveBeenCalledOnce();
      expect(result).toMatchObject({ statusCode: 204, type: "success" });
    });

    test("still associates (204) when the service is unavailable", async () => {
      mockEnsureAdopted.mockRejectedValueOnce(new CamsUnavailableError());

      const action = associationRuntimeAction();
      const params = createRuntimeActionParams({
        body: VALID_BODY,
        method: "post",
        path: "/",
      });

      const result = await action(params);

      expect(mockSetAssociationData).toHaveBeenCalledOnce();
      expect(result).toMatchObject({ statusCode: 204, type: "success" });
    });

    test("still associates (204) when S2S auth cannot be resolved", async () => {
      mockCreateCamsClient.mockImplementationOnce(() => {
        throw new Error("missing credentials");
      });

      const action = associationRuntimeAction();
      const params = createRuntimeActionParams({
        body: VALID_BODY,
        method: "post",
        path: "/",
      });

      const result = await action(params);

      expect(mockSetAssociationData).toHaveBeenCalledOnce();
      expect(result).toMatchObject({ statusCode: 204, type: "success" });
    });

    test("returns 409 and does not store on a terminal ownership conflict", async () => {
      mockEnsureAdopted.mockRejectedValueOnce(new CamsAdoptConflictError());

      const action = associationRuntimeAction();
      const params = createRuntimeActionParams({
        body: VALID_BODY,
        method: "post",
        path: "/",
      });

      const result = await action(params);

      expect(mockSetAssociationData).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        error: { statusCode: 409 },
        type: "error",
      });
    });

    test("returns 400 for invalid env values", async () => {
      const action = associationRuntimeAction();
      const params = createRuntimeActionParams({
        body: { ...VALID_BODY, commerceEnv: "invalid" },
        method: "post",
        path: "/",
      });

      const result = await action(params);

      expect(result).toMatchObject({
        error: { statusCode: 400 },
        type: "error",
      });
      expect(mockSetAssociationData).not.toHaveBeenCalled();
    });

    test("returns 400 when commerceBaseUrl is not a valid URL", async () => {
      const action = associationRuntimeAction();
      const params = createRuntimeActionParams({
        body: { ...VALID_BODY, commerceBaseUrl: "not-a-url" },
        method: "post",
        path: "/",
      });

      const result = await action(params);

      expect(result).toMatchObject({
        error: { statusCode: 400 },
        type: "error",
      });
      expect(mockSetAssociationData).not.toHaveBeenCalled();
    });

    test("returns 400 when the adopt identifiers are missing", async () => {
      const action = associationRuntimeAction();
      const params = createRuntimeActionParams({
        body: { commerceBaseUrl: "https://example.com", commerceEnv: "paas" },
        method: "post",
        path: "/",
      });

      const result = await action(params);

      expect(result).toMatchObject({
        error: { statusCode: 400 },
        type: "error",
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
        body: VALID_BODY,
        method: "post",
        path: "/",
      });

      const result = await action(params);

      expect(result).toMatchObject({
        error: { statusCode: 500 },
        type: "error",
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
      expect(result).toMatchObject({ statusCode: 204, type: "success" });
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
        error: { statusCode: 500 },
        type: "error",
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
