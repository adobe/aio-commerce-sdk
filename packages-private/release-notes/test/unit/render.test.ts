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

import { renderSlack } from "#render";

import type { RenderContext } from "#render";
import type { ReleaseNotes } from "#schema";

const SAMPLE_NOTES: ReleaseNotes = {
  breakingChanges: [],
  headline:
    "Nested ACL permissions and environment-scoped webhooks are now available.",
  highlights: [
    {
      description:
        "Admins can now delegate access to sub-resources without granting root access.",
    },
    {
      description:
        "Fixed an issue where webhook failures were not always reported correctly.",
    },
  ],
  summary:
    "This release introduces nested ACL permissions and environment-scoped webhooks, reducing integration complexity for admin extensions.",
};

const SAMPLE_CTX: RenderContext = {
  date: "2026-06-19",
  publishedPackages: [
    { name: "@adobe/aio-commerce-lib-admin-ui", version: "1.3.0" },
    { name: "@adobe/aio-commerce-sdk", version: "2.1.0" },
  ],
};

describe("renderSlack", () => {
  test("leads with the header emoji line", () => {
    const md = renderSlack(SAMPLE_NOTES, SAMPLE_CTX);
    expect(md.startsWith(":mega:")).toBe(true);
  });

  test("includes metadata block with date", () => {
    const md = renderSlack(SAMPLE_NOTES, SAMPLE_CTX);
    expect(md).toContain("*Date:* 2026-06-19");
    expect(md).toContain("*Owner:*");
    expect(md).toContain("*Status:* :white_check_mark: Released");
    expect(md).toContain("*Compatibility:*");
  });

  test("does not render the headline between metadata and highlights", () => {
    const md = renderSlack(SAMPLE_NOTES, SAMPLE_CTX);
    expect(md).not.toContain(SAMPLE_NOTES.headline);
    expect(md.indexOf("*Compatibility:*")).toBeLessThan(
      md.indexOf("*Highlights*"),
    );
  });

  test("renders a flat highlights list with no kind grouping", () => {
    const md = renderSlack(SAMPLE_NOTES, SAMPLE_CTX);
    expect(md).toContain("*Highlights*");
    expect(md).toContain(
      "  - Admins can now delegate access to sub-resources without granting root access.",
    );
    expect(md).toContain(
      "  - Fixed an issue where webhook failures were not always reported correctly.",
    );
    expect(md).not.toContain("New Features");
    expect(md).not.toContain("Bug Fixes");
  });

  test("renders breaking changes with warning emoji before regular highlights", () => {
    const withBreaking: ReleaseNotes = {
      ...SAMPLE_NOTES,
      breakingChanges: [
        {
          migration: "Replace `legacyAuth()` with `auth()`.",
          packages: ["@adobe/aio-commerce-lib-auth"],
          title: "Removed legacy auth",
        },
      ],
    };
    const md = renderSlack(withBreaking, SAMPLE_CTX);
    expect(md).toContain(":warning: Breaking Changes :warning:");
    expect(md).toContain("  - Removed legacy auth");
    expect(md.indexOf(":warning:")).toBeLessThan(
      md.indexOf(SAMPLE_NOTES.highlights[0]?.description ?? ""),
    );
  });

  test("skips highlights section when both arrays are empty", () => {
    const noHighlights: ReleaseNotes = {
      ...SAMPLE_NOTES,
      breakingChanges: [],
      highlights: [],
    };
    const md = renderSlack(noHighlights, SAMPLE_CTX);
    expect(md).not.toContain("*Highlights*");
  });

  test("renders summary under 'Why it matters'", () => {
    const md = renderSlack(SAMPLE_NOTES, SAMPLE_CTX);
    expect(md).toContain("*Why it matters*");
    expect(md.indexOf("*Why it matters*")).toBeLessThan(
      md.indexOf(SAMPLE_NOTES.summary),
    );
  });

  test("renders links section with github and npm package URLs", () => {
    const md = renderSlack(SAMPLE_NOTES, SAMPLE_CTX);
    expect(md).toContain("*Links*");
    expect(md).toContain("adobe/aio-commerce-sdk");
    expect(md).toContain("@adobe/aio-commerce-sdk@2.1.0");
    expect(md).toContain("Release notes");
    expect(md).toContain("npm");
  });

  test("sorts meta-package first in links regardless of input order", () => {
    const md = renderSlack(SAMPLE_NOTES, SAMPLE_CTX);
    expect(md.indexOf("@adobe/aio-commerce-sdk@2.1.0")).toBeLessThan(
      md.indexOf("@adobe/aio-commerce-lib-admin-ui@1.3.0"),
    );
  });

  test("ends with channel footer", () => {
    const md = renderSlack(SAMPLE_NOTES, SAMPLE_CTX);
    expect(
      md.endsWith(":speech_balloon: #commerce-app-mgmt for questions"),
    ).toBe(true);
  });

  test("sorts multiple non-meta packages alphabetically in links", () => {
    const multiLib: RenderContext = {
      date: "2026-06-19",
      publishedPackages: [
        { name: "@adobe/aio-commerce-lib-webhooks", version: "1.0.0" },
        { name: "@adobe/aio-commerce-lib-admin-ui", version: "1.3.0" },
      ],
    };
    const md = renderSlack(SAMPLE_NOTES, multiLib);
    expect(md.indexOf("aio-commerce-lib-admin-ui@1.3.0")).toBeLessThan(
      md.indexOf("aio-commerce-lib-webhooks@1.0.0"),
    );
  });

  test("renders highlights in the order they were given", () => {
    const twoHighlights: ReleaseNotes = {
      ...SAMPLE_NOTES,
      highlights: [
        { description: "First feature." },
        { description: "Second feature." },
      ],
    };
    const md = renderSlack(twoHighlights, SAMPLE_CTX);
    expect(md.indexOf("First feature.")).toBeLessThan(
      md.indexOf("Second feature."),
    );
  });

  test("meta-package is first in links when it is already first in input", () => {
    const metaFirst: RenderContext = {
      date: "2026-06-19",
      publishedPackages: [
        { name: "@adobe/aio-commerce-sdk", version: "2.1.0" },
        { name: "@adobe/aio-commerce-lib-admin-ui", version: "1.3.0" },
      ],
    };
    const md = renderSlack(SAMPLE_NOTES, metaFirst);
    expect(md.indexOf("@adobe/aio-commerce-sdk@2.1.0")).toBeLessThan(
      md.indexOf("@adobe/aio-commerce-lib-admin-ui@1.3.0"),
    );
  });
});
