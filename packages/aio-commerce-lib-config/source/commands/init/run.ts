import { stringifyError } from "#commands/utils";

import {
  detectPackageManager,
  ensureAppConfig,
  ensureEnvFile,
  ensureExtensibilityConfig,
  ensureInstallYaml,
  ensurePackageJsonScript,
  getExecCommand,
  installDependencies,
  runGeneration,
} from "./lib";
import { logger } from "./logger";

function makeStep<T extends (...args: Parameters<T>) => ReturnType<T>>(
  name: string,
  fn: T,
  ...args: Parameters<T>
) {
  return { name, fn: () => fn(...args) };
}

/** Initialize the project with @adobe/aio-commerce-lib-config */
export async function run() {
  try {
    logger.info("🚀 Initializing @adobe/aio-commerce-lib-config...\n");

    const packageManager = await detectPackageManager();
    const execCommand = getExecCommand(packageManager);

    const steps = [
      makeStep("ensureExtensibilityConfig", ensureExtensibilityConfig),
      makeStep("ensurePackageJsonScript", ensurePackageJsonScript, execCommand),
      makeStep("runGeneration", runGeneration),
      makeStep("ensureAppConfig", ensureAppConfig),
      makeStep("ensureInstallYaml", ensureInstallYaml),
      makeStep("ensureEnvFile", ensureEnvFile),
      makeStep("installDependencies", installDependencies, packageManager),
    ];

    for (const step of steps) {
      const { name, fn } = step;
      const result = await fn();

      if (!result) {
        logger.error(`❌ Initialization failed at step: ${name}\n`);
        throw new Error(`Initialization failed at step: ${name}`);
      }
    }

    logger.info("✅ Initialization complete!");
    logger.info(
      "📝 Next steps:\n" +
        "   1. Review and customize extensibility.config.js\n" +
        "   2. Fill in the required values in your .env file\n",
    );
  } catch (error) {
    logger.error(stringifyError(error as Error));
    logger.error("❌ Initialization failed\n");

    throw new Error("Initialization failed", { cause: error });
  }
}
