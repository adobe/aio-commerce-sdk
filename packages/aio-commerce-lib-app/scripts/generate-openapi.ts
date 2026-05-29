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

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { generateOpenAPISpec } from "@aio-commerce-sdk/common-utils/actions/openapi";
import consola from "consola";

import { router as appConfigRouter } from "#actions/app-config/router";
import { router as configRouter } from "#actions/config/router";
import { router as installationRouter } from "#actions/installation/router";
import { router as registrationRouter } from "#actions/registration/router";
import { router as scopeTreeRouter } from "#actions/scope-tree/router";

import pkg from "../package.json" with { type: "json" };

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Generates the OpenAPI specification for the App Management actions */
export async function generate() {
  try {
    const spec = generateOpenAPISpec(
      [
        { prefix: "/app-config", router: appConfigRouter },
        { prefix: "/config", router: configRouter },
        { prefix: "/installation", router: installationRouter },
        { prefix: "/registration", router: registrationRouter },
        { prefix: "/scope-tree", router: scopeTreeRouter },
      ],
      {
        title: "App Management API",
        version: pkg.version,

        license: {
          identifier: "Apache-2.0",
          name: "Apache-2.0",
        },
      },
      {
        security: [{ imsOAuth: [] }],
        securitySchemes: {
          imsOAuth: {
            type: "oauth2",
            flows: {
              clientCredentials: {
                scopes: {},
                tokenUrl: "https://ims-na1.adobelogin.com/ims/token/v3",
              },
            },
          },
        },

        servers: [{ url: "/" }],
      },
    );

    const outPath = join(__dirname, "../generated/openapi.gen.json");
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, JSON.stringify(spec, null, 2), "utf-8");

    consola.success(`Generated ${outPath}`);
  } catch (error) {
    consola.error("Failed to generate OpenAPI spec", error);
    throw error;
  }
}

generate().catch(() => {
  process.exit(1);
});
