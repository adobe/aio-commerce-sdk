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

import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightLlmsTxt from "starlight-llms-txt";

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
            { slug: "packages/aio-commerce-lib-api" },
            { slug: "packages/aio-commerce-lib-app" },
            { slug: "packages/aio-commerce-lib-auth" },
            { slug: "packages/aio-commerce-lib-config" },
            { slug: "packages/aio-commerce-lib-core" },
            { slug: "packages/aio-commerce-lib-events" },
            { slug: "packages/aio-commerce-lib-webhooks" },
          ],
        },
      ],
      plugins: [
        starlightLlmsTxt({
          projectName: "Adobe Commerce SDK for App Builder",
          description:
            "A TypeScript SDK with modular packages for building Adobe Commerce integrations on Adobe App Builder. Provides authentication, HTTP clients, events, webhooks, and configuration utilities.",
        }),
      ],
    }),
  ],
});
