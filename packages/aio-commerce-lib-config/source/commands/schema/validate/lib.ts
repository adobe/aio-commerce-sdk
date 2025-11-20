import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { EXTENSIBILITY_CONFIG_FILE } from "#commands/constants";
import {
  getProjectRootDirectory,
  readExtensibilityConfig,
  stringifyError,
} from "#commands/utils";

import { logger } from "./logger";

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
      logger.warn(
        `⚠️ Extensibility config file not found at ${resolvedPath}. Skipping validation.`,
      );

      // biome-ignore lint/correctness/noUnsafeFinally: Safe to return null
      return null;
    }
  }

  try {
    const extensibilityConfig = await readExtensibilityConfig(resolvedPath);
    return extensibilityConfig?.businessConfig?.schema;
  } catch (error) {
    logger.error(stringifyError(error as Error));
    logger.error("❌ Error loading extensibility.config.js");

    throw new Error("Error loading extensibility.config.js", { cause: error });
  }
}
