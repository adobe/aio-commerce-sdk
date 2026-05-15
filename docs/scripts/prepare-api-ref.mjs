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

/**
 * Adds Starlight-compatible YAML frontmatter to TypeDoc-generated markdown files.
 * TypeDoc does not emit frontmatter natively; Starlight requires a `title` field.
 * Also strips the first `#` heading from each file to avoid a duplicate with
 * Starlight's own rendered page title.
 *
 * Run this after `pnpm turbo run docs` and before `astro build`.
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const HEADING_RE = /^#+\s+(.+)/m;
const FIRST_HEADING_RE = /^#+[^\n]*\n\n?/;

const packagesDir = fileURLToPath(
  new URL("../src/content/docs/packages", import.meta.url),
);

async function processDir(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await processDir(full);
    } else if (entry.name.endsWith(".md") && dir.includes("api-reference")) {
      await processFile(full);
    }
  }
}

async function processFile(filePath) {
  const content = await readFile(filePath, "utf8");
  if (content.startsWith("---")) {
    return;
  }

  // Extract title from the first heading, stripping backtick-wrapping and
  // dropping the version suffix (e.g. `pkg`: `v1.0.0` → `pkg`).
  const headingMatch = content.match(HEADING_RE);
  const rawTitle =
    headingMatch?.[1] ?? filePath.split("/").pop().replace(".md", "");
  const title = rawTitle.replace(/`/g, "").split(": ")[0].trim();
  const escaped = title.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  // Strip the first heading line so it doesn't duplicate Starlight's page title.
  const body = content.replace(FIRST_HEADING_RE, "");

  await writeFile(
    filePath,
    `---\ntitle: "${escaped}"\neditUrl: false\nprev: false\nnext: false\n---\n\n${body}`,
  );
}

await processDir(packagesDir);
