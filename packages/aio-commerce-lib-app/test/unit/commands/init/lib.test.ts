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

import { execSync } from "node:child_process";

import { beforeEach, describe, expect, test, vi } from "vitest";

import { installDependencies } from "#commands/init/lib";

import type { CommerceAppConfigDomain } from "#config/index";

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

const mockedExecSync = vi.mocked(execSync);

function makeDomains(
  ...domains: CommerceAppConfigDomain[]
): Set<CommerceAppConfigDomain> {
  return new Set(domains);
}

describe("installDependencies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("installs @adobe/aio-commerce-lib-webhooks when 'webhooks' domain is selected", () => {
    installDependencies("npm", makeDomains("webhooks"), "/fake/cwd");

    expect(mockedExecSync).toHaveBeenCalledWith(
      expect.stringContaining("@adobe/aio-commerce-lib-webhooks"),
      expect.any(Object),
    );
  });

  test("installs @adobe/aio-commerce-lib-config when 'businessConfig.schema' domain is selected", () => {
    installDependencies(
      "npm",
      makeDomains("businessConfig.schema"),
      "/fake/cwd",
    );

    expect(mockedExecSync).toHaveBeenCalledWith(
      expect.stringContaining("@adobe/aio-commerce-lib-config"),
      expect.any(Object),
    );
  });

  test("installs both packages when both domains are selected", () => {
    installDependencies(
      "npm",
      makeDomains("businessConfig.schema", "webhooks"),
      "/fake/cwd",
    );

    const call = mockedExecSync.mock.calls[0][0] as string;
    expect(call).toContain("@adobe/aio-commerce-lib-config");
    expect(call).toContain("@adobe/aio-commerce-lib-webhooks");
  });

  test("does NOT install webhooks package when 'webhooks' domain is not selected", () => {
    installDependencies(
      "npm",
      makeDomains("businessConfig.schema"),
      "/fake/cwd",
    );

    const call = mockedExecSync.mock.calls[0][0] as string;
    expect(call).not.toContain("@adobe/aio-commerce-lib-webhooks");
  });
});
