import { stringifyError } from "#commands/utils";

import { loadBusinessConfigSchema } from "./lib";

/**
 * Validate the configuration schema.
 * @returns The validated schema.
 */
export async function run() {
  process.stdout.write("\n🔍 Validating configuration schema...\n");

  try {
    const result = await loadBusinessConfigSchema();
    if (result !== null) {
      process.stdout.write("✅ Configuration schema validation passed.\n");
      return result;
    }

    process.stdout.write("⚠️ No schema found to validate.\n");
    return null;
  } catch (error) {
    process.stderr.write(`${stringifyError(error as Error)}\n`);
    process.stderr.write("❌ Configuration schema validation failed\n");

    throw new Error("Configuration schema validation failed", { cause: error });
  }
}
