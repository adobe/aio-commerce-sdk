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

import libConfigPkg from "@adobe/aio-commerce-lib-config/package.json" with {
  type: "json",
};
import { describe, expect, test } from "vitest";

import { router as appConfigRouter } from "#actions/app-config/router";
import { router as associationRouter } from "#actions/association/router";
import { router as configRouter } from "#actions/config/router";
import { router as installationRouter } from "#actions/installation/router";
import { router as scopeTreeRouter } from "#actions/scope-tree/router";
import {
  SDK_LIB_VERSIONS,
  SDK_LIB_VERSIONS_HEADER,
  SDK_LIB_VERSIONS_HEADERS,
} from "#actions/version";
import { createRuntimeActionParams } from "#test/fixtures/actions";

import pkg from "../../../package.json" with { type: "json" };

const ROUTERS = {
  "app-config": appConfigRouter,
  association: associationRouter,
  config: configRouter,
  installation: installationRouter,
  "scope-tree": scopeTreeRouter,
};

describe("app version header", () => {
  test("uses the lowercase x-sdk-lib-versions name", () => {
    expect(SDK_LIB_VERSIONS_HEADER).toBe("x-sdk-lib-versions");
    expect(SDK_LIB_VERSIONS_HEADERS).toEqual({
      "x-sdk-lib-versions": SDK_LIB_VERSIONS,
    });
  });

  test("lists the exact lib-app and lib-config versions injected at build time", () => {
    expect(SDK_LIB_VERSIONS).toBe(
      `lib-app="${pkg.version}", lib-config="${libConfigPkg.version}"`,
    );
  });

  describe.each(Object.entries(ROUTERS))("%s router", (_name, router) => {
    test("adds the header to the 404 response", async () => {
      const result = await router.handler()(
        createRuntimeActionParams({ path: "/no-such-route" }),
      );

      expect(result).toMatchObject({
        error: {
          headers: { [SDK_LIB_VERSIONS_HEADER]: SDK_LIB_VERSIONS },
        },
        type: "error",
      });
    });
  });

  test("adds the header to a success response", async () => {
    const result = await appConfigRouter.handler()(
      createRuntimeActionParams({
        appConfig: {
          metadata: {
            description: "d",
            displayName: "n",
            id: "app",
            version: "1.0.0",
          },
        },
        path: "/openapi.json",
      }),
    );

    expect(result).toMatchObject({
      headers: { [SDK_LIB_VERSIONS_HEADER]: SDK_LIB_VERSIONS },
      type: "success",
    });
  });

  test("adds the header to an error response from a handler", async () => {
    const result = await appConfigRouter.handler()(
      createRuntimeActionParams({ path: "/" }),
    );

    expect(result).toMatchObject({
      error: {
        headers: { [SDK_LIB_VERSIONS_HEADER]: SDK_LIB_VERSIONS },
        statusCode: 500,
      },
      type: "error",
    });
  });
});
