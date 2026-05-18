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

import {
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
} from "#commands/constants";
import {
  getActionPath,
  getActionsDir,
  getExtConfigPath,
  getGeneratedDir,
  getManifestPath,
  getSchemaPath,
} from "#commands/utils";

describe("getGeneratedDir", () => {
  test("returns the .generated directory for the extensibility extension", () => {
    expect(getGeneratedDir(EXTENSIBILITY_EXTENSION_POINT_ID)).toBe(
      "src/commerce-extensibility-1/.generated",
    );
  });

  test("returns the .generated directory for the configuration extension", () => {
    expect(getGeneratedDir(CONFIGURATION_EXTENSION_POINT_ID)).toBe(
      "src/commerce-configuration-1/.generated",
    );
  });
});

describe("getActionsDir", () => {
  test("returns the actions directory for the extensibility extension", () => {
    expect(getActionsDir(EXTENSIBILITY_EXTENSION_POINT_ID)).toBe(
      "src/commerce-extensibility-1/.generated/actions/app-management",
    );
  });

  test("returns the actions directory for the configuration extension", () => {
    expect(getActionsDir(CONFIGURATION_EXTENSION_POINT_ID)).toBe(
      "src/commerce-configuration-1/.generated/actions/app-management",
    );
  });
});

describe("getActionPath", () => {
  test("returns the path to a specific extensibility action file", () => {
    expect(getActionPath(EXTENSIBILITY_EXTENSION_POINT_ID, "app-config")).toBe(
      "src/commerce-extensibility-1/.generated/actions/app-management/app-config.js",
    );
  });

  test("appends the .js extension to the action name", () => {
    const path = getActionPath(EXTENSIBILITY_EXTENSION_POINT_ID, "anything");
    expect(path).toBe(
      "src/commerce-extensibility-1/.generated/actions/app-management/anything.js",
    );
  });
});

describe("getExtConfigPath", () => {
  test("returns the ext.config.yaml path for the extensibility extension", () => {
    expect(getExtConfigPath(EXTENSIBILITY_EXTENSION_POINT_ID)).toBe(
      "src/commerce-extensibility-1/ext.config.yaml",
    );
  });

  test("returns the ext.config.yaml path for the configuration extension", () => {
    expect(getExtConfigPath(CONFIGURATION_EXTENSION_POINT_ID)).toBe(
      "src/commerce-configuration-1/ext.config.yaml",
    );
  });
});

describe("getManifestPath", () => {
  test("returns the manifest path under the extensibility .generated directory", () => {
    expect(getManifestPath()).toBe(
      "src/commerce-extensibility-1/.generated/app.commerce.manifest.json",
    );
  });
});

describe("getSchemaPath", () => {
  test("returns the schema path under the configuration .generated directory", () => {
    expect(getSchemaPath()).toBe(
      "src/commerce-configuration-1/.generated/configuration-schema.json",
    );
  });
});
