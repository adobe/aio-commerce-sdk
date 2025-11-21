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
    process.stdout.write(
      "🚀 Initializing @adobe/aio-commerce-lib-config...\n\n",
    );

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
        process.stderr.write(`❌ Initialization failed at step: ${name}\n`);
        throw new Error(`Initialization failed at step: ${name}`);
      }
    }

    process.stdout.write("✅ Initialization complete!\n");
    process.stdout.write(
      "📝 Next steps:\n" +
        "   1. Review and customize extensibility.config.js\n" +
        "   2. Fill in the required values in your .env file\n",
    );
  } catch (error) {
    process.stderr.write(`${stringifyError(error as Error)}\n`);
    process.stderr.write("❌ Initialization failed\n");

    throw new Error("Initialization failed", { cause: error });
  }
}
