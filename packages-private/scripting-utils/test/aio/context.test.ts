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

import { getAioCliEnv, getAioProjectContext } from "#aio/context";
import { withAioConfig } from "#test/fixtures/aio-config";

describe("getAioProjectContext", () => {
  test("returns the project and namespace when both are configured", async () => {
    const project = { id: "project-id" };

    await withAioConfig(
      { project, runtime: { namespace: "my-namespace" } },
      () => {
        expect(getAioProjectContext()).toEqual({
          namespace: "my-namespace",
          project,
        });
      },
    );
  });

  test("throws when the project is not configured", async () => {
    await withAioConfig({ runtime: { namespace: "my-namespace" } }, () => {
      expect(() => getAioProjectContext()).toThrow(
        "The current App Builder project and Runtime namespace are required",
      );
    });
  });

  test("throws when the runtime namespace is not configured", async () => {
    await withAioConfig({ project: { id: "project-id" } }, () => {
      expect(() => getAioProjectContext()).toThrow(
        "The current App Builder project and Runtime namespace are required",
      );
    });
  });
});

describe("getAioCliEnv", () => {
  test("returns 'stage' when configured", async () => {
    await withAioConfig({ cli: { env: "stage" } }, () => {
      expect(getAioCliEnv()).toBe("stage");
    });
  });

  test("defaults to 'prod' when unset", async () => {
    await withAioConfig({}, () => {
      expect(getAioCliEnv()).toBe("prod");
    });
  });

  test("defaults to 'prod' for any other value", async () => {
    await withAioConfig({ cli: { env: "something-else" } }, () => {
      expect(getAioCliEnv()).toBe("prod");
    });
  });
});
