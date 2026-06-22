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

import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { AdminUiProvider } from "../../source/admin-ui/provider";
import { adminUiFixtures, adminUiHandlers } from "../fixtures/admin-ui";

import type { Resource } from "@aio-commerce-sdk/iacly";
import type { LibIaclyConfig } from "../../source/index";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("AdminUiProvider", () => {
  let provider: AdminUiProvider;

  beforeEach(() => {
    provider = new AdminUiProvider(adminUiFixtures.client);
  });

  const resource = () => provider.resources[0];

  describe("resource metadata", () => {
    it("has correct kind", () => {
      expect(resource().kind).toBe("admin-ui/extension");
    });

    it("has no dependencies", () => {
      expect(resource().dependsOn).toEqual([]);
    });

    it("has no list() method (snapshot-only)", () => {
      // Cast to base Resource interface to access the optional list property.
      expect(
        (resource() as Resource<LibIaclyConfig, unknown, unknown>).list,
      ).toBeUndefined();
    });
  });

  describe("check()", () => {
    it("returns extensions from config", async () => {
      const config = {
        adminUi: { extensions: [adminUiFixtures.desired.extension] },
      };
      const desired = await resource().check(config);
      expect(desired).toHaveLength(1);
    });

    it("returns [] when adminUi config is absent", async () => {
      expect(await resource().check({})).toEqual([]);
    });
  });

  describe("diff()", () => {
    it("returns create when current is null (no previous snapshot)", () => {
      const result = resource().diff(null, adminUiFixtures.desired.extension);
      expect(result.kind).toBe("create");
    });

    it("returns noop when current matches desired", () => {
      const result = resource().diff(
        adminUiFixtures.state.extension,
        adminUiFixtures.desired.extension,
      );
      expect(result.kind).toBe("noop");
    });

    it("returns replace when extensionUrl changes", () => {
      const changed = {
        ...adminUiFixtures.desired.extension,
        extensionUrl: "https://new.example.com",
      };
      const result = resource().diff(adminUiFixtures.state.extension, changed);
      expect(result.kind).toBe("replace");
    });
  });

  describe("create()", () => {
    it("calls registerExtension and returns state with extensionId", async () => {
      server.use(...adminUiHandlers.register);
      const state = await resource().create(
        adminUiFixtures.desired.extension,
        new Map(),
      );
      expect(state.extensionId).toBe("ext-id-abc");
    });
  });

  describe("delete()", () => {
    it("calls unregisterExtension", async () => {
      server.use(...adminUiHandlers.unregister);
      await expect(
        resource().delete(
          "myExtension:production",
          adminUiFixtures.state.extension,
        ),
      ).resolves.toBeUndefined();
    });
  });
});
