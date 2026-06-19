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

import { renderMarkdown } from "#render";

import type { ReleaseNotes } from "#schema";

const SAMPLE_NOTES: ReleaseNotes = {
  headline:
    "Nested ACL permissions and environment-scoped webhooks are now available.",
  highlights: [
    {
      title: "Nested ACL permissions",
      whatChanged: "The admin UI now supports hierarchical permission checks.",
      whyItMatters:
        "Admins can delegate access to sub-resources without granting root access.",
      packages: ["@adobe/aio-commerce-lib-admin-ui"],
      prLinks: ["https://github.com/adobe/aio-commerce-sdk/pull/42"],
    },
  ],
  breakingChanges: [],
  byPackage: [
    {
      name: "@adobe/aio-commerce-sdk",
      version: "2.1.0",
      bump: "minor",
      entries: ["Added nested ACL permission helpers."],
    },
    {
      name: "@adobe/aio-commerce-lib-admin-ui",
      version: "1.3.0",
      bump: "minor",
      entries: ["Added nested ACL permission helpers."],
    },
  ],
  contributors: ["@contributor"],
};

describe("renderMarkdown", () => {
  test("leads with the headline", () => {
    const md = renderMarkdown(SAMPLE_NOTES);
    expect(md.indexOf("Nested ACL")).toBeLessThan(md.indexOf("Highlights"));
  });

  test("renders highlights section", () => {
    const md = renderMarkdown(SAMPLE_NOTES);
    expect(md).toContain("## Highlights");
    expect(md).toContain("Nested ACL permissions");
    expect(md).toContain("PR](https://github.com");
  });

  test("omits PR links text when prLinks is empty", () => {
    const withNoPrLinks: ReleaseNotes = {
      ...SAMPLE_NOTES,
      highlights: [
        {
          title: "Silent change",
          whatChanged: "Refactored internals.",
          whyItMatters: "Faster startup.",
          packages: ["@adobe/aio-commerce-lib-core"],
          prLinks: [],
        },
      ],
    };
    const md = renderMarkdown(withNoPrLinks);
    expect(md).not.toContain("PR](");
    expect(md).toContain("Silent change");
  });

  test("renders by-package section after highlights", () => {
    const md = renderMarkdown(SAMPLE_NOTES);
    expect(md.indexOf("## Highlights")).toBeLessThan(
      md.indexOf("## By Package"),
    );
  });

  test("renders contributors section last", () => {
    const md = renderMarkdown(SAMPLE_NOTES);
    const contribIdx = md.indexOf("## Contributors");
    const byPkgIdx = md.indexOf("## By Package");
    expect(contribIdx).toBeGreaterThan(byPkgIdx);
  });

  test("skips breaking changes section when array is empty", () => {
    const md = renderMarkdown(SAMPLE_NOTES);
    expect(md).not.toContain("## Breaking Changes");
  });

  test("renders breaking changes when present", () => {
    const withBreaking: ReleaseNotes = {
      ...SAMPLE_NOTES,
      breakingChanges: [
        {
          title: "Removed legacy auth",
          migration: "Replace `legacyAuth()` with `auth()`.",
          packages: ["@adobe/aio-commerce-lib-auth"],
        },
      ],
    };
    const md = renderMarkdown(withBreaking);
    expect(md).toContain("## Breaking Changes");
    expect(md).toContain("Replace `legacyAuth()`");
  });

  test("renders major and patch bump labels in by-package section", () => {
    const withMixedBumps: ReleaseNotes = {
      ...SAMPLE_NOTES,
      byPackage: [
        {
          name: "@adobe/aio-commerce-sdk",
          version: "3.0.0",
          bump: "major",
          entries: ["Removed legacy API."],
        },
        {
          name: "@adobe/aio-commerce-lib-core",
          version: "1.0.1",
          bump: "patch",
          entries: ["Fixed a bug."],
        },
      ],
    };
    const md = renderMarkdown(withMixedBumps);
    expect(md).toContain("(Major)");
    expect(md).toContain("(Patch)");
  });

  test("skips highlights section when array is empty", () => {
    const withNoHighlights: ReleaseNotes = { ...SAMPLE_NOTES, highlights: [] };
    const md = renderMarkdown(withNoHighlights);
    expect(md).not.toContain("## Highlights");
  });

  test("skips contributors section when array is empty", () => {
    const withNoContribs: ReleaseNotes = { ...SAMPLE_NOTES, contributors: [] };
    const md = renderMarkdown(withNoContribs);
    expect(md).not.toContain("## Contributors");
  });

  test("skips by-package section when array is empty", () => {
    const withNoPackages: ReleaseNotes = { ...SAMPLE_NOTES, byPackage: [] };
    const md = renderMarkdown(withNoPackages);
    expect(md).not.toContain("## By Package");
  });

  test("render order is: headline > highlights > breaking > by-package > contributors", () => {
    const withBreaking: ReleaseNotes = {
      ...SAMPLE_NOTES,
      breakingChanges: [{ title: "BC", migration: "m", packages: ["p"] }],
    };
    const md = renderMarkdown(withBreaking);
    const headlineIdx = md.indexOf("Nested ACL permissions");
    const highlightIdx = md.indexOf("## Highlights");
    const breakingIdx = md.indexOf("## Breaking Changes");
    const byPkgIdx = md.indexOf("## By Package");
    const contribIdx = md.indexOf("## Contributors");
    expect(headlineIdx).toBeLessThan(highlightIdx);
    expect(highlightIdx).toBeLessThan(breakingIdx);
    expect(breakingIdx).toBeLessThan(byPkgIdx);
    expect(byPkgIdx).toBeLessThan(contribIdx);
  });
});
