import { inspect } from "node:util";

import { minimalValidConfig } from "./config";

import type { CommerceAppConfig } from "#config/schema/app";

/** The minimum set of files needed for our commands to work (no config file). */
export const EMPTY_PROJECT = makeProjectFiles(null);

/** The minimum set of files needed for our commands to work with a valid config. */
export const MINIMAL_PROJECT = makeProjectFiles(minimalValidConfig);

/** The minimum set of files needed for our commands to work with an invalid config. */
export const INVALID_PROJECT = makeProjectFiles({
  // @ts-expect-error - On purpose, reusable invalid config for testing.
  metadata: { id: "invalid" },
});

/**
 * Creates temp file entries for a project with a config file.
 *
 * @param config - The config to serialize into the config file.
 * @param format - The format of the config file, either CommonJS or ESM. Defaults to CommonJS.
 * @param extras - Any additional files to include in the project, as a record of file paths to contents.
 */
export function makeProjectFiles(
  config: CommerceAppConfig | null = null,
  format: "cjs" | "esm" = "esm",
  projectExtras: Record<string, string> = {},
): Record<string, string> {
  const type = format === "esm" ? "module" : "commonjs";
  const packageJson = JSON.stringify({ type });

  if (!config) {
    return {
      "package.json": packageJson,
      ...projectExtras,
    };
  }

  const serialized = inspect(config ?? {}, { depth: null });
  const fileName =
    format === "esm" ? "app.commerce.config.ts" : "app.commerce.config.js";

  const content =
    format === "esm"
      ? `export default ${serialized}`
      : `module.exports = ${serialized}`;

  return {
    "package.json": packageJson,
    [fileName]: content,
    ...projectExtras,
  };
}

/**
 * Create a string representation of environment variables for use in .env files.
 * @param env The variables to serialize, as a record of variable names to values.
 */
export function envObject(env: Record<string, string>): string {
  return Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}
