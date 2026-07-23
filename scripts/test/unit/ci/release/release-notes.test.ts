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

import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("@aio-commerce-sdk/release-notes", () => ({
  assembleReleaseNotes: vi.fn().mockReturnValue({
    breakingChanges: [],
    headline: "Test Release",
    highlights: [],
    summary: "This test release contains no changes.",
  }),
  collectEntries: vi.fn().mockResolvedValue([]),
  generateAllNotes: vi.fn().mockResolvedValue({
    results: [],
    summary: "Test holistic summary.",
    totalUsage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
  }),
  renderSlack: vi.fn().mockReturnValue(":mega: Test Release :tada:\n"),
  selectModel: vi.fn().mockReturnValue({ model: {}, modelId: "test-model" }),
}));

import main from "#ci/release/release-notes";
import {
  asCore,
  asExec,
  CORE_PACKAGE_JSON,
  createCoreMock,
  createExecMock,
  SDK_AND_CORE_PACKAGES_JSON,
} from "#test/fixtures/release";

function stubEnv(values: {
  notesEnabled?: string;
  notesModel?: string;
  publishedPackages?: string;
}) {
  vi.stubEnv("RELEASE_NOTES_ENABLED", values.notesEnabled ?? "");
  vi.stubEnv("RELEASE_NOTES_MODEL", values.notesModel ?? "");
  vi.stubEnv("PUBLISHED_PACKAGES", values.publishedPackages ?? "");
}

function createSummaryMock() {
  const summary = {
    addHeading: vi.fn(),
    addRaw: vi.fn(),
    write: vi.fn().mockResolvedValue(undefined),
  };
  summary.addHeading.mockReturnValue(summary);
  summary.addRaw.mockReturnValue(summary);
  return summary;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("release/release-notes.ts", () => {
  test("skips when RELEASE_NOTES_ENABLED is not 'true'", async () => {
    const core = createCoreMock();
    stubEnv({ notesEnabled: "false" });

    await main(asCore(core), asExec(createExecMock()));

    expect(core.info).toHaveBeenCalledWith(expect.stringContaining("disabled"));
    expect(core.setOutput).not.toHaveBeenCalled();
  });

  test("skips when no packages were published", async () => {
    const core = createCoreMock();
    stubEnv({
      notesEnabled: "true",

      notesModel: "test-model",
      publishedPackages: "[]",
    });

    await main(asCore(core), asExec(createExecMock()));

    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining("No published packages"),
    );
    expect(core.setOutput).not.toHaveBeenCalled();
  });

  test("throws when PUBLISHED_PACKAGES is missing", async () => {
    const core = createCoreMock();
    stubEnv({ notesEnabled: "true" });

    await expect(main(asCore(core), asExec(createExecMock()))).rejects.toThrow(
      "Missing PUBLISHED_PACKAGES",
    );
  });

  test("throws when RELEASE_NOTES_MODEL is missing", async () => {
    const core = createCoreMock();
    stubEnv({
      notesEnabled: "true",
      publishedPackages: CORE_PACKAGE_JSON,
    });

    await expect(main(asCore(core), asExec(createExecMock()))).rejects.toThrow(
      "Missing RELEASE_NOTES_MODEL",
    );
  });

  test("sets outputs and writes job summary on success", async () => {
    const summary = createSummaryMock();
    const core = { ...createCoreMock(), summary };
    stubEnv({
      notesEnabled: "true",

      notesModel: "test-model",
      publishedPackages: SDK_AND_CORE_PACKAGES_JSON,
    });

    await main(asCore(core), asExec(createExecMock()));

    expect(core.setOutput).toHaveBeenCalledWith(
      "releaseNotes",
      expect.any(String),
    );
    expect(core.setOutput).toHaveBeenCalledWith(
      "releaseNotesMarkdown",
      expect.any(String),
    );
    expect(summary.write).toHaveBeenCalled();
  });
});
