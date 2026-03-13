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

import announce from "#ci/release/announce";
import {
  asCore,
  CORE_PACKAGE_JSON,
  createCoreMock,
  INTERNAL_PACKAGE_BASE_URL,
  INTERNAL_SDK_PACKAGE_JSON,
  INVALID_PACKAGES_JSON,
  PUBLIC_PACKAGE_BASE_URL,
  SDK_AND_CORE_PACKAGES_JSON,
  THREE_PACKAGES_JSON,
} from "#test/fixtures/release";

/** Stubs the environment variables for the announce script. */
function stubAnnounceEnv(values: {
  publishedPackages?: string;
  registryPackageBaseUrl?: string;
  releaseChannel?: string;
}) {
  vi.stubEnv("PUBLISHED_PACKAGES", values.publishedPackages ?? "");
  vi.stubEnv("RELEASE_CHANNEL", values.releaseChannel ?? "");
  vi.stubEnv("REGISTRY_PACKAGE_BASE_URL", values.registryPackageBaseUrl ?? "");
}

describe("release/announce.ts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  test("writes the return value as a step output", () => {
    const core = createCoreMock();
    stubAnnounceEnv({
      publishedPackages: SDK_AND_CORE_PACKAGES_JSON,
      registryPackageBaseUrl: PUBLIC_PACKAGE_BASE_URL,
      releaseChannel: "public",
    });

    const payload = announce(asCore(core));
    const serializedPayload = core.setOutput.mock.calls[0]?.[1];

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledTimes(1);
    expect(core.setOutput).toHaveBeenCalledWith(
      "slackWebhookPayload",
      expect.any(String),
    );
    expect(serializedPayload).toBe(JSON.stringify(payload));
  });

  test("generates public announcement", () => {
    const core = createCoreMock();
    stubAnnounceEnv({
      publishedPackages: SDK_AND_CORE_PACKAGES_JSON,
      registryPackageBaseUrl: PUBLIC_PACKAGE_BASE_URL,
      releaseChannel: "public",
    });

    const payload = announce(asCore(core));
    const text = payload.blocks[0]?.text.text ?? "";

    expect(text).toContain("public (NPM)");
    expect(text).toContain(
      `${PUBLIC_PACKAGE_BASE_URL}/@adobe/aio-commerce-sdk`,
    );
    expect(text).toContain(
      `${PUBLIC_PACKAGE_BASE_URL}/@adobe/aio-commerce-lib-core`,
    );
    expect(text.indexOf("@adobe/aio-commerce-sdk@1.0.0")).toBeLessThan(
      text.indexOf("@adobe/aio-commerce-lib-core@1.0.0"),
    );
  });

  test("generates internal announcement with the registry package URL", () => {
    const core = createCoreMock();
    stubAnnounceEnv({
      publishedPackages: INTERNAL_SDK_PACKAGE_JSON,
      registryPackageBaseUrl: INTERNAL_PACKAGE_BASE_URL,
      releaseChannel: "internal",
    });

    const payload = announce(asCore(core));
    const text = payload.blocks[0]?.text.text ?? "";

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(text).toContain("internal (Artifactory)");
    expect(text).toContain(
      `${INTERNAL_PACKAGE_BASE_URL}@adobe/aio-commerce-sdk`,
    );
  });

  test("sorts non-sdk packages alphabetically after the sdk package", async () => {
    const core = createCoreMock();
    stubAnnounceEnv({
      publishedPackages: THREE_PACKAGES_JSON,
      registryPackageBaseUrl: PUBLIC_PACKAGE_BASE_URL,
      releaseChannel: "public",
    });

    const payload = await announce(asCore(core));
    const text = payload.blocks[0]?.text.text ?? "";

    expect(text.indexOf("@adobe/aio-commerce-sdk@1.0.0")).toBeLessThan(
      text.indexOf("@adobe/aio-commerce-lib-alpha@1.0.0"),
    );

    expect(text.indexOf("@adobe/aio-commerce-lib-alpha@1.0.0")).toBeLessThan(
      text.indexOf("@adobe/aio-commerce-lib-zeta@1.0.0"),
    );
  });

  test("fails when published packages are missing", () => {
    const core = createCoreMock();
    stubAnnounceEnv({
      registryPackageBaseUrl: PUBLIC_PACKAGE_BASE_URL,
      releaseChannel: "public",
    });

    expect(() => announce(asCore(core))).toThrow();
  });

  test("fails when registry package base URL is missing", () => {
    const core = createCoreMock();
    stubAnnounceEnv({
      publishedPackages: CORE_PACKAGE_JSON,
      releaseChannel: "public",
    });

    expect(() => announce(asCore(core))).toThrow();
  });

  test("fails when the release channel is invalid", () => {
    const core = createCoreMock();
    stubAnnounceEnv({
      publishedPackages: CORE_PACKAGE_JSON,
      registryPackageBaseUrl: PUBLIC_PACKAGE_BASE_URL,
      releaseChannel: "beta",
    });

    expect(() => announce(asCore(core))).toThrow();
  });

  test("fails when published packages JSON is invalid", () => {
    const core = createCoreMock();
    stubAnnounceEnv({
      publishedPackages: INVALID_PACKAGES_JSON,
      registryPackageBaseUrl: PUBLIC_PACKAGE_BASE_URL,
      releaseChannel: "public",
    });

    expect(() => announce(asCore(core))).toThrow();
    expect(core.setFailed).toHaveBeenCalledTimes(1);
  });
});
