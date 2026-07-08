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

import {
  resolveCommerceImsCredentials,
  resolveShellImsCredentials,
} from "#web/react/auth/lib";

import type { SharedContext } from "#web/react/commerce/types";
import type { ShellConfiguration } from "#web/react/shell/types";

/** Builds a minimal stand-in for the `SharedContext` map provided by the UIX host. */
function makeSharedContext(values: Record<string, string>) {
  const map = new Map(Object.entries(values));

  // @ts-expect-error -- The `SharedContext` class of `@adobe/uix-guest` has private members
  // and is not exported, so a structural `get` stub is the closest possible stand-in.
  const sharedContext: SharedContext["sharedContext"] = {
    get: (key: string) => map.get(key) ?? null,
  };

  return sharedContext;
}

describe("resolveCommerceImsCredentials", () => {
  test("returns the credentials when both values are present", () => {
    const sharedContext = makeSharedContext({
      imsToken: "test-token",
      imsOrgId: "test-org",
    });

    expect(resolveCommerceImsCredentials(sharedContext)).toEqual({
      imsToken: "test-token",
      imsOrgId: "test-org",
    });
  });

  test.each([
    ["imsToken", { imsOrgId: "test-org" }],
    ["imsOrgId", { imsToken: "test-token" }],
    ["both values", {}],
  ])("returns null when %s is missing", (_label, values) => {
    expect(resolveCommerceImsCredentials(makeSharedContext(values))).toBeNull();
  });
});

describe("resolveShellImsCredentials", () => {
  test("returns null when no shell configuration is available", () => {
    expect(resolveShellImsCredentials(null)).toBeNull();
  });

  test("maps the shell configuration to IMS credentials", () => {
    const shellConfiguration: ShellConfiguration = {
      imsToken: "t",
      imsOrg: "o",
      theme: "light",
    };

    expect(resolveShellImsCredentials(shellConfiguration)).toEqual({
      imsToken: "t",
      imsOrgId: "o",
    });
  });
});
