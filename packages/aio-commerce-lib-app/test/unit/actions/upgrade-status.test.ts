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

import {
  createMockInstallationParams,
  createMockLogger,
} from "#test/fixtures/installation";

const { mockGetAssociationData, mockSetAssociationData } = vi.hoisted(() => ({
  mockGetAssociationData: vi.fn(),
  mockSetAssociationData: vi.fn(),
}));

const {
  mockPostStatusToId,
  mockFindOwnedByWorkspace,
  mockCreateCamsClient,
  mockResolveCamsBaseUrl,
} = vi.hoisted(() => {
  const postStatusToId = vi.fn();
  const findOwnedByWorkspace = vi.fn();
  return {
    mockCreateCamsClient: vi.fn(() => ({
      ensureAdopted: vi.fn(),
      findOwnedByWorkspace,
      patchConfig: vi.fn(),
      postStatus: vi.fn(),
      postStatusToId,
    })),
    mockFindOwnedByWorkspace: findOwnedByWorkspace,
    mockPostStatusToId: postStatusToId,
    mockResolveCamsBaseUrl: vi.fn(() => "https://cams.test"),
  };
});

const { mockGetImsAuthProvider, mockResolveImsAuthParams } = vi.hoisted(() => ({
  mockGetImsAuthProvider: vi.fn(() => ({
    getAccessToken: vi.fn(),
    getHeaders: vi.fn(),
  })),
  mockResolveImsAuthParams: vi.fn(() => ({
    clientId: "client-1",
    clientSecrets: ["secret"],
    imsOrgId: "org@AdobeOrg",
    scopes: ["scope"],
    technicalAccountEmail: "tech@example.com",
    technicalAccountId: "tech-1",
  })),
}));

vi.mock("#management/association/repository", () => ({
  getAssociationData: mockGetAssociationData,
  setAssociationData: mockSetAssociationData,
}));

vi.mock("@adobe/aio-commerce-lib-auth", () => ({
  getImsAuthProvider: mockGetImsAuthProvider,
  resolveImsAuthParams: mockResolveImsAuthParams,
}));

vi.mock("#management/cams/index", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#management/cams/index")>();
  return {
    ...actual,
    createCamsClient: mockCreateCamsClient,
    resolveCamsBaseUrl: mockResolveCamsBaseUrl,
  };
});

import { createUpgradeStatusReporter } from "#actions/installation/cams-status";

import type { LifecycleExecutionRouteParams } from "#actions/installation/common";

const WORKSPACE_ID = "test-workspace-id";
const WORKSPACE_NAME = "test-workspace-name";
const EXTENSION_ID = "0192f0aa-record-id";

function createParams(): LifecycleExecutionRouteParams {
  return {
    appData: {
      consumerOrgId: "test-consumer-org-id",
      orgName: "test-org-name",
      projectId: "test-project-id",
      projectName: "test-project-name",
      projectTitle: "Test Project Title",
      workspaceId: WORKSPACE_ID,
      workspaceName: WORKSPACE_NAME,
      workspaceTitle: "Test Workspace Title",
    },
    attemptId: "attempt-1",
    ...createMockInstallationParams(),
  } as unknown as LifecycleExecutionRouteParams;
}

describe("createUpgradeStatusReporter", () => {
  const logger = createMockLogger();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAssociationData.mockResolvedValue({
      camsExtensionId: EXTENSION_ID,
      commerce: { baseUrl: "https://example.com", env: "paas" },
      commerceId: "commerce-1",
      extId: "ext-1",
    });
  });

  test("posts status by the persisted record id without a workspace lookup", async () => {
    const reporter = await createUpgradeStatusReporter({
      logger,
      params: createParams(),
    });

    expect(reporter).toBeDefined();
    // No identity is needed when addressing the record by id.
    expect(mockCreateCamsClient).toHaveBeenCalledWith(
      expect.not.objectContaining({ identity: expect.anything() }),
    );
    expect(mockFindOwnedByWorkspace).not.toHaveBeenCalled();

    await reporter?.updating("2.0.0");
    expect(mockPostStatusToId).toHaveBeenCalledWith(EXTENSION_ID, {
      status: "UPDATING",
      version: "2.0.0",
    });
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Reported auto-upgrade status "UPDATING"'),
    );
  });

  test("reports installed and updateFailed with the right status/version", async () => {
    const reporter = await createUpgradeStatusReporter({
      logger,
      params: createParams(),
    });

    await reporter?.installed("2.0.0");
    expect(mockPostStatusToId).toHaveBeenCalledWith(EXTENSION_ID, {
      status: "INSTALLED",
      version: "2.0.0",
    });

    const error = { code: "SOME_FAILURE", message: "It failed" };
    await reporter?.updateFailed("2.0.0", error);
    expect(mockPostStatusToId).toHaveBeenCalledWith(EXTENSION_ID, {
      error,
      status: "UPDATE_FAILED",
      version: "2.0.0",
    });
  });

  test("swallows a rejected status post", async () => {
    mockPostStatusToId.mockRejectedValueOnce(new Error("network error"));

    const reporter = await createUpgradeStatusReporter({
      logger,
      params: createParams(),
    });

    await expect(reporter?.updating("2.0.0")).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalled();
  });

  test("recovers and backfills the record id when it is not persisted", async () => {
    mockGetAssociationData.mockResolvedValue({
      commerce: { baseUrl: "https://example.com", env: "paas" },
      commerceId: "commerce-1",
    });
    mockFindOwnedByWorkspace.mockResolvedValue([
      {
        commerceId: "commerce-1",
        id: EXTENSION_ID,
        workspaceId: WORKSPACE_ID,
        workspaceName: WORKSPACE_NAME,
      },
    ]);

    const reporter = await createUpgradeStatusReporter({
      logger,
      params: createParams(),
    });

    expect(mockFindOwnedByWorkspace).toHaveBeenCalledWith(
      WORKSPACE_ID,
      WORKSPACE_NAME,
    );
    expect(mockSetAssociationData).toHaveBeenCalledWith(
      expect.objectContaining({ camsExtensionId: EXTENSION_ID }),
    );

    await reporter?.updating("2.0.0");
    expect(mockPostStatusToId).toHaveBeenCalledWith(EXTENSION_ID, {
      status: "UPDATING",
      version: "2.0.0",
    });
  });

  test("disambiguates multiple owned records by the persisted commerceId", async () => {
    mockGetAssociationData.mockResolvedValue({
      commerce: { baseUrl: "https://example.com", env: "paas" },
      commerceId: "commerce-2",
    });
    mockFindOwnedByWorkspace.mockResolvedValue([
      {
        commerceId: "commerce-1",
        id: "other-record",
        workspaceId: WORKSPACE_ID,
        workspaceName: WORKSPACE_NAME,
      },
      {
        commerceId: "commerce-2",
        id: EXTENSION_ID,
        workspaceId: WORKSPACE_ID,
        workspaceName: WORKSPACE_NAME,
      },
    ]);

    const reporter = await createUpgradeStatusReporter({
      logger,
      params: createParams(),
    });

    await reporter?.updating("2.0.0");
    expect(mockPostStatusToId).toHaveBeenCalledWith(
      EXTENSION_ID,
      expect.anything(),
    );
  });

  test("still reports when persisting the recovered id fails", async () => {
    mockGetAssociationData.mockResolvedValue({
      commerce: { baseUrl: "https://example.com", env: "paas" },
      commerceId: "commerce-1",
    });
    mockFindOwnedByWorkspace.mockResolvedValue([
      {
        commerceId: "commerce-1",
        id: EXTENSION_ID,
        workspaceId: WORKSPACE_ID,
        workspaceName: WORKSPACE_NAME,
      },
    ]);
    mockSetAssociationData.mockRejectedValueOnce(new Error("state down"));

    const reporter = await createUpgradeStatusReporter({
      logger,
      params: createParams(),
    });

    await reporter?.updating("2.0.0");
    expect(mockPostStatusToId).toHaveBeenCalledWith(
      EXTENSION_ID,
      expect.anything(),
    );
    expect(logger.warn).toHaveBeenCalled();
  });

  test("returns undefined when no owned record can be resolved", async () => {
    mockGetAssociationData.mockResolvedValue({
      commerce: { baseUrl: "https://example.com", env: "paas" },
      commerceId: "commerce-1",
    });
    mockFindOwnedByWorkspace.mockResolvedValue([]);

    const reporter = await createUpgradeStatusReporter({
      logger,
      params: createParams(),
    });

    expect(reporter).toBeUndefined();
    expect(mockPostStatusToId).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("could not resolve the app's record id"),
    );
  });

  test("returns undefined when the app is not associated", async () => {
    mockGetAssociationData.mockResolvedValue(null);

    const reporter = await createUpgradeStatusReporter({
      logger,
      params: createParams(),
    });

    expect(reporter).toBeUndefined();
    expect(mockCreateCamsClient).not.toHaveBeenCalled();
  });

  test("returns undefined when workspace information is missing", async () => {
    const params = createParams();
    (params.appData as { workspaceName?: string }).workspaceName = undefined;

    const reporter = await createUpgradeStatusReporter({ logger, params });

    expect(reporter).toBeUndefined();
    expect(mockCreateCamsClient).not.toHaveBeenCalled();
  });

  test("returns undefined when getAssociationData rejects", async () => {
    mockGetAssociationData.mockRejectedValueOnce(new Error("state down"));

    await expect(
      createUpgradeStatusReporter({ logger, params: createParams() }),
    ).resolves.toBeUndefined();

    expect(logger.warn).toHaveBeenCalled();
  });

  test("returns undefined when the workspace lookup throws", async () => {
    mockGetAssociationData.mockResolvedValue({
      commerce: { baseUrl: "https://example.com", env: "paas" },
      commerceId: "commerce-1",
    });
    mockFindOwnedByWorkspace.mockRejectedValueOnce(new Error("service down"));

    const reporter = await createUpgradeStatusReporter({
      logger,
      params: createParams(),
    });

    expect(reporter).toBeUndefined();
    expect(logger.warn).toHaveBeenCalled();
  });
});
