#!/usr/bin/env -S tsx

import { execSync } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  outro,
  text,
} from "@clack/prompts";
import { findUp } from "find-up";
import mustache from "mustache";
import color from "picocolors";

/** The options for the create-package wizard. */
type WizardOptions = {
  name: string;
  isPrivate: boolean;
  willContainTests: boolean;
};

/**
 * Asserts that the value is not a cancellation.
 *
 * @param value - The value to check.
 * @param step - The step that was cancelled.
 */
function assertCancelled(value: unknown, step: string) {
  if (isCancel(value)) {
    cancel(`Operation cancelled during step: ${step}`);
    process.exit(0);
  }
}

/**
 * Checks if a directory exists.
 * @param path - The path to the directory.
 */
async function pathExists(path: string) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/** Finds the root directory of the workspace. */
async function findPackagesDir() {
  const workspaceFile = await findUp("pnpm-workspace.yaml", {
    // The directory where the script is located.
    cwd: dirname(fileURLToPath(import.meta.url)),
  });

  if (!workspaceFile) {
    outro(color.bgRedBright(" Root workspace file not found "));
    process.exit(1);
  }

  return resolve(dirname(workspaceFile), "./packages");
}

/**
 * Writes a file from a template.
 * @param targetPath - The path to the target file.
 * @param templatePath - The path to the template file.
 * @param data - The data to render the template with.
 */
async function writeFromTemplate(
  targetPath: string,
  templatePath: string,
  data?: Record<string, unknown>,
) {
  if (await pathExists(targetPath)) {
    outro(color.bgRedBright(` ${targetPath} already exists! `));
    process.exit(1);
  }

  if (!(await pathExists(templatePath))) {
    outro(color.bgRedBright(` ${templatePath} not found! `));
    process.exit(1);
  }

  const templateContents = await readFile(templatePath, {
    encoding: "utf-8",
  });

  const rendered = mustache.render(templateContents, data, undefined, {
    // Default escaping is for HTML, which we don't need.
    escape: (value: string) => value,
  });

  const pathParts = targetPath.split("/").slice(-3);
  log.step(color.blue(`Writing ${pathParts.join("/")}...`));

  await writeFile(targetPath, rendered);
}

/**
 * Runs `pnpm install` in the package directory.
 * @param packageDir - The directory of the package to install dependencies in.
 */
function runPnpmInstall(packageDir: string) {
  log.info(color.blue(`Installing dependencies in ${packageDir}...`));
  execSync("pnpm install", {
    cwd: packageDir,
  });
}

/**
 * Creates a new package in the "/packages" directory.
 * @param name - The name of the package.
 */
async function createPackage({
  name,
  isPrivate,
  willContainTests,
}: WizardOptions) {
  log.info(
    color.blue(`Creating package ${name} in the "/packages" directory...`),
  );

  const packagesDir = await findPackagesDir();
  const createDir = resolve(packagesDir, name);

  if (await pathExists(createDir)) {
    outro(color.bgRedBright(` Package ${name} already exists `));
    process.exit(1);
  }

  try {
    // Private packages are scoped to the monorepo.
    // Public packages are scoped to the Adobe NPM organization.
    const packageDir = `packages/${name}`;
    const packageName = isPrivate
      ? `@aio-commerce-sdk/${name}`
      : `@adobe/${name}`;

    // Create the package directory and setup initial files.
    await mkdir(createDir, { recursive: true });
    await mkdir(resolve(createDir, "source"));
    await writeFile(resolve(createDir, "README.md"), `# ${packageName}`);
    await writeFile(
      resolve(createDir, "source/index.ts"),
      "// Write your code here...",
    );

    await writeFromTemplate(
      resolve(createDir, "package.json"),
      resolve(__dirname, "../templates/package.template.json"),
      {
        name: packageName,
        private: isPrivate,
        description: `Description for ${packageName}`,
        packageDirectory: packageDir,
      },
    );

    await writeFromTemplate(
      resolve(createDir, "tsconfig.json"),
      resolve(__dirname, "../templates/tsconfig.template.json"),
    );

    await writeFromTemplate(
      resolve(createDir, "tsdown.config.ts"),
      resolve(__dirname, "../templates/tsdown.template.ts"),
    );

    if (willContainTests) {
      await mkdir(resolve(createDir, "tests"));
      await writeFromTemplate(
        resolve(createDir, "vitest.config.ts"),
        resolve(__dirname, "../templates/vitest.template.ts"),
      );

      await writeFile(
        resolve(createDir, "tests/index.test.ts"),
        "// Write your tests here...",
      );
    }

    await runPnpmInstall(resolve(packagesDir, name));
  } catch (error) {
    log.error(`${error}`);
    outro(color.bgRedBright(" Package creation failed! "));

    process.exit(1);
  }
}

/** Runs the create-package script. */
export async function run() {
  intro(color.bgBlueBright(" @aio-commerce-sdk/create-package "));

  const name = await text({
    message: "What is the name of the package?",
    placeholder: "aio-commerce-lib-{name}",
  });

  assertCancelled(name, "package-name-input");
  const isPrivate = await confirm({
    initialValue: false,
    message:
      "Is the package private? (i.e. not published to npm and used only within the monorepo)",
  });

  assertCancelled(isPrivate, "package-private-input");
  const willContainTests = await confirm({
    initialValue: false,
    message: "Will the package contain unit/integration tests?",
  });

  assertCancelled(willContainTests, "package-tests-input");
  await createPackage({
    name: String(name),
    isPrivate: Boolean(isPrivate),
    willContainTests: Boolean(willContainTests),
  });

  outro(color.bgGreenBright(" Package created successfully! "));
}

run();
