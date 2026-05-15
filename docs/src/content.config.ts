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

import { defineCollection } from "astro:content";
import { docsSchema } from "@astrojs/starlight/schema";
import { glob } from "astro/loaders";

const DOCS_PREFIX = "docs/src/content/docs/";
const EXTENSION_RE = /\.(mdx?)$/;
const PACKAGE_RE = /^packages\/([^/]+)\//;

// content.config.ts is at docs/src/content.config.ts.
// Two levels up from this file reaches the repo root (docs/src → docs → repo root).
const repoRoot = new URL("../../", import.meta.url);

export const collections = {
  docs: defineCollection({
    loader: glob({
      base: repoRoot,
      pattern: [
        "docs/src/content/docs/**/*.{md,mdx}",
        "packages/*/docs/usage.md",
      ],
      generateId: ({ entry }) => {
        if (entry.startsWith(DOCS_PREFIX)) {
          return entry.replace(DOCS_PREFIX, "").replace(EXTENSION_RE, "");
        }
        const match = entry.match(PACKAGE_RE);
        if (match) {
          return `packages/${match[1]}`;
        }
        return entry.replace(EXTENSION_RE, "");
      },
    }),
    schema: docsSchema(),
  }),
};
