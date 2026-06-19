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

import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { PackageNotesSchema, ReleaseNotesSchema } from "#schema";

const VALID_PACKAGE_NOTES = {
  packageName: "@adobe/aio-commerce-lib-core",
  version: "2.1.0",
  bump: "minor",
  headline: "Nested ACL permissions are now supported.",
  highlights: [
    {
      title: "Nested ACL",
      whatChanged: "Added hierarchical permission checks.",
      whyItMatters: "Enables granular admin access delegation.",
      prLinks: ["https://github.com/adobe/aio-commerce-sdk/pull/42"],
    },
  ],
  breakingChanges: [],
  entries: ["Added nested ACL permission helpers."],
  contributors: ["@contributor"],
};

const VALID_RELEASE_NOTES = {
  headline: "Nested ACL permissions and webhooks are now available.",
  highlights: [
    {
      title: "Nested ACL",
      whatChanged: "Added hierarchical permission checks.",
      whyItMatters: "Enables granular admin access delegation.",
      packages: ["@adobe/aio-commerce-lib-admin-ui"],
      prLinks: [],
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
  ],
  contributors: [],
};

describe("PackageNotesSchema", () => {
  test("validates a well-formed object", () => {
    const result = v.safeParse(PackageNotesSchema, VALID_PACKAGE_NOTES);
    expect(result.success).toBe(true);
  });

  test("rejects an invalid bump value", () => {
    const result = v.safeParse(PackageNotesSchema, {
      ...VALID_PACKAGE_NOTES,
      bump: "hotfix",
    });
    expect(result.success).toBe(false);
  });

  test("requires packageName to be a string", () => {
    const result = v.safeParse(PackageNotesSchema, {
      ...VALID_PACKAGE_NOTES,
      packageName: 123,
    });
    expect(result.success).toBe(false);
  });
});

describe("ReleaseNotesSchema", () => {
  test("validates a well-formed aggregate object", () => {
    const result = v.safeParse(ReleaseNotesSchema, VALID_RELEASE_NOTES);
    expect(result.success).toBe(true);
  });

  test("rejects a missing headline", () => {
    const { headline: _, ...withoutHeadline } = VALID_RELEASE_NOTES;
    const result = v.safeParse(ReleaseNotesSchema, withoutHeadline);
    expect(result.success).toBe(false);
  });

  test("accepts an empty contributors array", () => {
    const result = v.safeParse(ReleaseNotesSchema, {
      ...VALID_RELEASE_NOTES,
      contributors: [],
    });
    expect(result.success).toBe(true);
  });

  test("rejects an invalid bump in byPackage", () => {
    const result = v.safeParse(ReleaseNotesSchema, {
      ...VALID_RELEASE_NOTES,
      byPackage: [
        { name: "x", version: "1.0.0", bump: "invalid", entries: [] },
      ],
    });
    expect(result.success).toBe(false);
  });
});
