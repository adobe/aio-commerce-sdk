import { inspect } from "@aio-commerce-sdk/common-utils/logging";

// @ts-expect-error - Importing the template as a raw string for testing purposes.
import customScripts from "#templates/custom-scripts.js?raw";
// @ts-expect-error - Importing the template as a raw string for testing purposes.
import installationTemplate from "#templates/installation.js?raw";

import type { PackageJson } from "type-fest";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";

export const templates = {
  installation: installationTemplate as string,
  customScripts: customScripts as string,
};

/**
 * Creates a mock package.json object for testing purposes.
 * @param overrides - Optional properties to override the default package.json values.
 */
export function createMockPackageJson(overrides?: Partial<PackageJson>) {
  return {
    name: "test-app",
    version: "1.0.0",
    type: "module",
    ...overrides,
  };
}

/**
 * Creates the contents of a mock app.commerce.config.* file for testing purposes.
 * @param contents - The contents to include in the mock app.commerce.config.* file.
 */
export function createMockCommerceAppConfigFileContents(
  contents: CommerceAppConfigOutputModel,
) {
  return `export default ${inspect(contents)}`;
}
