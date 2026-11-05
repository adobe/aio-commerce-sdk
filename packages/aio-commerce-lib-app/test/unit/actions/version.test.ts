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
import { SDK_LIB_VERSIONS } from "#actions/version";
import { createRuntimeActionParams } from "#test/fixtures/actions";

import pkg from "../../../package.json" with { type: "json" };

const ROUTERS = {
  "app-config": appConfigRouter,
  association: associationRouter,
  config: configRouter,
  installation: installationRouter,
  "scope-tree": scopeTreeRouter,
};

const EXPECTED_VERSIONS = `lib-app="${pkg.version}", lib-config="${libConfigPkg.version}"`;
const EXPECTED_HEADERS = { "x-ac-sdk-lib-versions": EXPECTED_VERSIONS };

describe("app version header", () => {
  test("lists the lib-app build version and the lib-config version it loads", () => {
    expect(SDK_LIB_VERSIONS).toBe(EXPECTED_VERSIONS);
  });

  describe.each(Object.entries(ROUTERS))("%s router", (_name, router) => {
    test("adds the header to the 404 response", async () => {
      const result = await router.handler()(
        createRuntimeActionParams({ path: "/no-such-route" }),
      );

      expect(result).toMatchObject({
        error: { headers: EXPECTED_HEADERS, statusCode: 404 },
        type: "error",
      });
    });

    test("adds the header to the 405 response", async () => {
      const result = await router.handler()(
        createRuntimeActionParams({ method: "head", path: "/" }),
      );

      expect(result).toMatchObject({
        error: { headers: EXPECTED_HEADERS, statusCode: 405 },
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
      headers: EXPECTED_HEADERS,
      statusCode: 200,
      type: "success",
    });
  });

  test("adds the header to an error response from a handler", async () => {
    const result = await appConfigRouter.handler()(
      createRuntimeActionParams({ path: "/" }),
    );

    expect(result).toMatchObject({
      error: { headers: EXPECTED_HEADERS, statusCode: 500 },
      type: "error",
    });
  });

  test("adds the header to a validation error", async () => {
    const result = await configRouter.handler()(
      createRuntimeActionParams({
        body: { notAValidBody: true },
        method: "patch",
        path: "/",
      }),
    );

    expect(result).toMatchObject({
      error: { headers: EXPECTED_HEADERS, statusCode: 400 },
      type: "error",
    });
  });
});
