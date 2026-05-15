/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

// NOTE: One-time manual step required after the first deployment:
// In repo Settings → Pages, set "Build and deployment > Source" to "GitHub Actions".
// The workflow cannot configure this itself.

import path from "node:path";

import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightLlmsTxt from "starlight-llms-txt";
import { createStarlightTypeDocPlugin } from "starlight-typedoc";

// Resolve paths relative to this config file so they work regardless of CWD.
const repoRoot = path.resolve(import.meta.dirname, "..");

function pkg(packageName, ...segments) {
  return path.join(repoRoot, "packages", packageName, ...segments);
}

// Each package needs its own [plugin, sidebarGroup] pair so their API reference
// sections appear independently in the sidebar.
const [typeDocApi, typeDocApiGroup] = createStarlightTypeDocPlugin();
const [typeDocApp, typeDocAppGroup] = createStarlightTypeDocPlugin();
const [typeDocAuth, typeDocAuthGroup] = createStarlightTypeDocPlugin();
const [typeDocConfig, typeDocConfigGroup] = createStarlightTypeDocPlugin();
const [typeDocCore, typeDocCoreGroup] = createStarlightTypeDocPlugin();
const [typeDocEvents, typeDocEventsGroup] = createStarlightTypeDocPlugin();
const [typeDocWebhooks, typeDocWebhooksGroup] = createStarlightTypeDocPlugin();

// TypeDoc options shared by all packages, mirroring configs/typedoc/typedoc.base.json.
const baseTypeDocOptions = {
  excludeExternals: true,
  expandObjects: true,
  expandParameters: true,
  hideBreadcrumbs: true,
  hidePageHeader: true,
  useCodeBlocks: true,
  useTsLinkResolution: true,
  indexFormat: "table",
  parametersFormat: "table",
};

export default defineConfig({
  site: "https://adobe.github.io",
  base: "/aio-commerce-sdk",
  integrations: [
    starlight({
      title: "Adobe Commerce SDK for App Builder",
      description:
        "TypeScript SDK for building Adobe Commerce integrations on Adobe App Builder",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/adobe/aio-commerce-sdk",
        },
      ],
      editLink: {
        baseUrl: "https://github.com/adobe/aio-commerce-sdk/edit/main/",
      },
      lastUpdated: true,
      sidebar: [
        {
          label: "Guides",
          items: [{ autogenerate: { directory: "guides" } }],
        },
        {
          label: "Packages",
          items: [
            {
              label: "@adobe/aio-commerce-lib-api",
              items: [
                { label: "Overview", slug: "packages/aio-commerce-lib-api" },
                typeDocApiGroup,
              ],
            },
            {
              label: "@adobe/aio-commerce-lib-app",
              items: [
                { label: "Overview", slug: "packages/aio-commerce-lib-app" },
                typeDocAppGroup,
              ],
            },
            {
              label: "@adobe/aio-commerce-lib-auth",
              items: [
                { label: "Overview", slug: "packages/aio-commerce-lib-auth" },
                typeDocAuthGroup,
              ],
            },
            {
              label: "@adobe/aio-commerce-lib-config",
              items: [
                {
                  label: "Overview",
                  slug: "packages/aio-commerce-lib-config",
                },
                typeDocConfigGroup,
              ],
            },
            {
              label: "@adobe/aio-commerce-lib-core",
              items: [
                { label: "Overview", slug: "packages/aio-commerce-lib-core" },
                typeDocCoreGroup,
              ],
            },
            {
              label: "@adobe/aio-commerce-lib-events",
              items: [
                {
                  label: "Overview",
                  slug: "packages/aio-commerce-lib-events",
                },
                typeDocEventsGroup,
              ],
            },
            {
              label: "@adobe/aio-commerce-lib-webhooks",
              items: [
                {
                  label: "Overview",
                  slug: "packages/aio-commerce-lib-webhooks",
                },
                typeDocWebhooksGroup,
              ],
            },
          ],
        },
      ],
      plugins: [
        starlightLlmsTxt({
          projectName: "Adobe Commerce SDK for App Builder",
          description:
            "A TypeScript SDK with modular packages for building Adobe Commerce integrations on Adobe App Builder. Provides authentication, HTTP clients, events, webhooks, and configuration utilities.",
        }),
        typeDocApi({
          entryPoints: [
            pkg("aio-commerce-lib-api", "source/index.ts"),
            pkg("aio-commerce-lib-api", "source/utils/index.ts"),
          ],
          tsconfig: pkg("aio-commerce-lib-api", "tsconfig.json"),
          output: "packages/aio-commerce-lib-api/api",
          sidebar: { label: "API Reference", collapsed: true },
          typeDoc: {
            ...baseTypeDocOptions,
            intentionallyNotExported: [
              "RequiredComerceHttpClientConfig",
              "HttpClientBase",
            ],
          },
        }),
        typeDocApp({
          entryPoints: [
            pkg("aio-commerce-lib-app", "source/actions/index.ts"),
            pkg("aio-commerce-lib-app", "source/config/index.ts"),
            pkg("aio-commerce-lib-app", "source/commands/index.ts"),
            pkg("aio-commerce-lib-app", "source/management/index.ts"),
          ],
          tsconfig: pkg("aio-commerce-lib-app", "tsconfig.json"),
          output: "packages/aio-commerce-lib-app/api",
          sidebar: { label: "API Reference", collapsed: true },
          typeDoc: {
            ...baseTypeDocOptions,
            validation: { notExported: false },
          },
        }),
        typeDocAuth({
          entryPoints: [pkg("aio-commerce-lib-auth", "source/index.ts")],
          tsconfig: pkg("aio-commerce-lib-auth", "tsconfig.json"),
          output: "packages/aio-commerce-lib-auth/api",
          sidebar: { label: "API Reference", collapsed: true },
          typeDoc: {
            ...baseTypeDocOptions,
            validation: { notExported: false },
          },
        }),
        typeDocConfig({
          entryPoints: [pkg("aio-commerce-lib-config", "source/index.ts")],
          tsconfig: pkg("aio-commerce-lib-config", "tsconfig.json"),
          output: "packages/aio-commerce-lib-config/api",
          sidebar: { label: "API Reference", collapsed: true },
          typeDoc: {
            ...baseTypeDocOptions,
            intentionallyNotExported: ["FieldSchema"],
            validation: { notExported: false },
          },
        }),
        typeDocCore({
          entryPoints: [
            pkg("aio-commerce-lib-core", "source/error/index.ts"),
            pkg("aio-commerce-lib-core", "source/params/index.ts"),
            pkg("aio-commerce-lib-core", "source/responses/index.ts"),
          ],
          tsconfig: pkg("aio-commerce-lib-core", "tsconfig.json"),
          output: "packages/aio-commerce-lib-core/api",
          sidebar: { label: "API Reference", collapsed: true },
          typeDoc: {
            ...baseTypeDocOptions,
            entryPointStrategy: "expand",
            validation: { notExported: false },
          },
        }),
        typeDocEvents({
          entryPoints: [
            pkg("aio-commerce-lib-events", "source/commerce/index.ts"),
            pkg("aio-commerce-lib-events", "source/io-events/index.ts"),
          ],
          tsconfig: pkg("aio-commerce-lib-events", "tsconfig.json"),
          output: "packages/aio-commerce-lib-events/api",
          sidebar: { label: "API Reference", collapsed: true },
          typeDoc: {
            ...baseTypeDocOptions,
            validation: { notExported: false },
          },
        }),
        typeDocWebhooks({
          entryPoints: [
            pkg("aio-commerce-lib-webhooks", "source/api/index.ts"),
            pkg("aio-commerce-lib-webhooks", "source/responses/index.ts"),
          ],
          tsconfig: pkg("aio-commerce-lib-webhooks", "tsconfig.json"),
          output: "packages/aio-commerce-lib-webhooks/api",
          sidebar: { label: "API Reference", collapsed: true },
          typeDoc: {
            ...baseTypeDocOptions,
            validation: { notExported: false },
          },
        }),
      ],
    }),
  ],
});
