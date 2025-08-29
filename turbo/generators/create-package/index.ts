/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import type { PlopTypes } from "@turbo/gen";

/** The options for the create-package wizard. */
type WizardOptions = {
  name: string;
  isPrivate: boolean;
  willContainTests: boolean;
};

/** Data of the created package. */
type PackageData = {
  packageDir: string;
  packageName: string;
  scopedPackageName: string;
  isPrivate: boolean;
  willContainTests: boolean;
};

// Apparently Plop.js doesn't support ESM, only dynamic imports work.
// We can't add them at the top level because they need to be awaited.
async function __importDeps() {
  const ansis = (await import("ansis")).default;
  const prompts = await import("@clack/prompts");

  return { ansis, prompts };
}

/**
 * Parses the given wizard options and returns the data of the package to be created.
 * @param options - The options for the create-package wizard.
 */
function getPackageData(options: WizardOptions) {
  const { name, isPrivate } = options;

  // Private packages are scoped to the monorepo.
  // Public packages are scoped to the Adobe NPM organization.
  const scopedPackageName = isPrivate
    ? `@aio-commerce-sdk/${name}`
    : `@adobe/${name}`;

  const packageDir = isPrivate
    ? `packages-private/${name}`
    : `packages/${name}`;

  return {
    packageName: name,
    scopedPackageName,
    packageDir,
    ...options,
  } satisfies PackageData;
}

/** Gathers the answers for the create-package generator. */
async function createPackageWizard() {
  // biome-ignore lint/suspicious/noConsole: Leave a bit of room for the prompt wizard.
  console.log("");

  const { ansis, prompts } = await __importDeps();
  prompts.intro(ansis.bgBlueBright(" @aio-commerce-sdk/create-package "));

  const data = await prompts.group(
    {
      name: () =>
        prompts.text({
          message: "What is the name of the package?",
          placeholder: "aio-commerce-lib-{name}",
          initialValue: "aio-commerce-lib-",
          defaultValue: "aio-commerce-lib-unnamed",

          validate: (value) => {
            if (value?.trim().length === 0) {
              return "Package name cannot be empty";
            }
          },
        }),

      isPrivate: () =>
        prompts.confirm({
          initialValue: false,
          message: `Is the package private? ${ansis.gray(
            '(i.e. scoped to the monorepo, not published to the public "@adobe" NPM registry)',
          )}`,
        }),

      willContainTests: () =>
        prompts.confirm({
          initialValue: true,
          message: "Will the package contain unit/integration tests?",
        }),
    },
    {
      onCancel: () => {
        prompts.cancel(ansis.bgRedBright(" Operation cancelled by the user. "));
        process.exit(0);
      },
    },
  );

  prompts.outro(ansis.bgGreenBright(" Answers gathered! "));
  return getPackageData(data) satisfies PackageData;
}

/** Returns the template files to be used for the package. */
function getTemplateFiles({ willContainTests }: PackageData) {
  const templateFiles = ["create-package/template/**/*.hbs"];

  // This test files are excluded conditionally based on the answers.
  if (!willContainTests) {
    templateFiles.push("!create-package/template/vitest.config.ts.hbs");
    templateFiles.push("!create-package/template/test/*.hbs");
  }

  return templateFiles;
}

/** Formats the generated files. */
const formatFiles: PlopTypes.CustomActionFunction = async (answers) => {
  const { execSync } = await import("node:child_process");
  const { packageDir } = answers as PackageData;
  execSync("pnpm run format", { cwd: packageDir });

  return "Formatted generated files";
};

/** Installs the dependencies for the package. */
const installDependencies: PlopTypes.CustomActionFunction = async (answers) => {
  const { execSync } = await import("node:child_process");
  const { packageDir } = answers as PackageData;
  execSync("pnpm install", { cwd: packageDir });

  return "Installed dependencies";
};

/** The configuration for the `create-package` Prop generator. */
export function getGeneratorConfig(): PlopTypes.PlopGeneratorConfig {
  // Gather the answers via @clack/prompts and not via Plop.js inquirer.
  const prompts = async () => {
    return await createPackageWizard();
  };

  return {
    description:
      "Creates a new package in the @adobe/aio-commerce-sdk monorepo",

    prompts,
    actions(data) {
      const packageData = data as PackageData;
      return [
        {
          type: "addMany",
          destination: packageData.packageDir,
          base: "create-package/template",
          stripExtensions: ["hbs"],
          templateFiles: getTemplateFiles(packageData),
        },
        formatFiles,
        installDependencies,
      ];
    },
  };
}
