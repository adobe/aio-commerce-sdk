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

import { inspect } from "@aio-commerce-sdk/common-utils/logging";
import { isESM } from "@aio-commerce-sdk/scripting-utils/project";
import consola from "consola";
import { colorize } from "consola/utils";

import { COMMERCE_APP_CONFIG_FILE } from "#commands/constants";

import { DOMAIN_DEFAULTS } from "./constants";

import type { CommerceAppConfig, CommerceAppConfigDomain } from "#config/index";
import type { InitFlags } from "./main";

export type ScaffoldAppAnswers = {
  appName: string;
  configFile: string;
  configFormat: "ts" | "js";
  domains: Set<CommerceAppConfigDomain>;
};

/**
 * Convert the given init options to answers for scaffolding the app config. This is useful for non-interactive use cases, such as running the command with a config file or from another script.
 * @param flags - The initialization options
 */
export function initFlagsToScaffoldAppAnswers(
  flags: InitFlags,
): ScaffoldAppAnswers {
  const configFile = `${COMMERCE_APP_CONFIG_FILE}.${flags.configFormat}`;
  return {
    appName: flags.appName,
    configFile,
    configFormat: flags.configFormat,
    domains: new Set<CommerceAppConfigDomain>(flags.domains),
  };
}

/** Prompt the user to scaffold a new Commerce App configuration. When options are provided, prompts are skipped. */
export async function promptForCommerceAppConfig(): Promise<ScaffoldAppAnswers> {
  const configFormat = await consola.prompt(
    "What format do you want to use for the config file?",
    {
      cancel: "reject",
      default: "ts",
      initial: "ts",
      options: [
        { hint: "Recommended", label: "TypeScript", value: "ts" },
        { label: "JavaScript", value: "js" },
      ] as const,
      type: "select",
    },
  );

  const appName = await consola.prompt("What is the name of your app?", {
    cancel: "reject",
    default: "My Application",
    placeholder: "Application Display Name",
    type: "text",
  });

  const featuresToAdd = await consola.prompt(
    `What features do you want to add to your app? ${colorize("gray", "Space to select/deselect, Enter to submit")}`,
    {
      cancel: "reject",
      initial: [],

      options: [
        { label: "Business Configuration", value: "businessConfig.schema" },
        { label: "Commerce Events", value: "eventing.commerce" },
        { label: "Commerce Webhooks", value: "webhooks" },
        { label: "External Events", value: "eventing.external" },
        {
          label: "Custom Installation Steps",
          value: "installation.customInstallationSteps",
        },
      ] as const,
      required: true,
      type: "multiselect",
    },
  );

  const configFile = `${COMMERCE_APP_CONFIG_FILE}.${configFormat}`;
  const domains = new Set<CommerceAppConfigDomain>(
    // @ts-expect-error - The return type seems to be incorrect, a string array is returned from `.prompt()` for `multiselect`
    featuresToAdd as string[],
  );

  consola.log("");
  return {
    appName,
    configFile,
    configFormat,
    domains,
  };
}

/** Create the default commerce app config file content */
export async function getDefaultCommerceAppConfig(
  cwd: string,
  { appName, configFormat, domains }: ScaffoldAppAnswers,
) {
  const isEcmaScript = await isESM(cwd);
  const needsESM = isEcmaScript || configFormat === "ts";

  const exportKeyword = needsESM ? "export default" : "module.exports =";
  const importStatement = needsESM
    ? 'import { defineConfig } from "@adobe/aio-commerce-lib-app/config";'
    : 'const { defineConfig } = require("@adobe/aio-commerce-lib-app/config");';

  const defaultConfig: Partial<CommerceAppConfig> = {
    metadata: {
      description:
        "A custom Adobe Commerce application. Fill description for your app.",
      displayName: appName,
      id: appName.toLowerCase().replace(/ /gu, "-"),
      version: "1.0.0",
    },
  };

  if (domains.has("businessConfig.schema")) {
    defaultConfig.businessConfig = {
      schema: DOMAIN_DEFAULTS.businessConfig.schema,
    };
  }

  if (domains.has("eventing.commerce")) {
    defaultConfig.eventing = {
      ...defaultConfig.eventing,
      commerce: DOMAIN_DEFAULTS["eventing.commerce"],
    };
  }

  if (domains.has("eventing.external")) {
    defaultConfig.eventing = {
      ...defaultConfig.eventing,
      external: DOMAIN_DEFAULTS["eventing.external"],
    };
  }

  if (domains.has("installation.customInstallationSteps")) {
    defaultConfig.installation = {
      customInstallationSteps:
        DOMAIN_DEFAULTS["installation.customInstallationSteps"],
    };
  }

  if (domains.has("webhooks")) {
    defaultConfig.webhooks = DOMAIN_DEFAULTS.webhooks;
  }

  const configContent = inspect(defaultConfig, { colors: false });
  return [
    importStatement,
    "",
    `${exportKeyword} defineConfig(${configContent})`,
  ].join("\n");
}
