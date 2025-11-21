import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { EXTENSIBILITY_CONFIG_FILE } from "#commands/constants";
import {
  getProjectRootDirectory,
  readExtensibilityConfig,
  stringifyError,
} from "#commands/utils";

/** Load the business configuration schema from the given path. */
export async function loadBusinessConfigSchema() {
  let resolvedPath: string | null = null;
  try {
    resolvedPath = resolve(
      await getProjectRootDirectory(),
      EXTENSIBILITY_CONFIG_FILE,
    );
  } finally {
    if (!(resolvedPath && existsSync(resolvedPath))) {
      process.stderr.write(
        `⚠️ Extensibility config file not found at ${resolvedPath}. Skipping validation.\n`,
      );

      // biome-ignore lint/correctness/noUnsafeFinally: Safe to return null
      return null;
    }
  }

  try {
    const extensibilityConfig = await readExtensibilityConfig();
    if (!extensibilityConfig) {
      return null;
    }

    return extensibilityConfig.businessConfig?.schema ?? null;
  } catch (error) {
    process.stderr.write(`${stringifyError(error as Error)}\n`);
    process.stderr.write("❌ Error loading extensibility.config.js\n");

    throw new Error("Error loading extensibility.config.js", { cause: error });
  }
}
