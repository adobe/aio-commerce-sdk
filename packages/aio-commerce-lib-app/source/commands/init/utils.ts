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

import { COMMERCE_APP_CONFIG_FILE } from "#commands/constants";

import { FEATURE_DEFAULTS } from "./constants";

import type { CommerceAppConfig, CommerceAppConfigDomain } from "#config/index";

type ScaffoldAppAnswers = {
  appName: string;
  configFile: string;
  features: Set<CommerceAppConfigDomain>;
};

/** Prompt the user to scaffold a new Commerce App configuration. */
export async function promptForCommerceAppConfig() {
  const configFormat = await consola.prompt(
    "What format do you want to use for the config file?",
    {
      type: "select",
      options: [
        { label: "TypeScript", value: "ts", hint: "Recommended" },
        { label: "JavaScript", value: "js" },
      ],
      default: "ts",
    },
  );

  const appName = await consola.prompt("What is the name of your app?", {
    type: "text",
    placeholder: "Application Display Name",
    default: "My Application",
  });

  const featuresToAdd = await consola.prompt(
    [
      "What features do you want to add to your app?",
      "Space to select/deselect, Enter to submit",
    ].join("\n"),
    {
      type: "multiselect",
      initial: [],
      required: true,

      options: [
        { label: "Business Configuration", value: "businessConfig" },
        { label: "Commerce Events", value: "eventing.commerce" },
        { label: "External Events", value: "eventing.external" },
      ] as const,
    },
  );

  const configFile = `${COMMERCE_APP_CONFIG_FILE}.${configFormat}`;
  const features = new Set<CommerceAppConfigDomain>(
    featuresToAdd.map((feature) => feature.value),
  );

  return { appName, configFile, features } satisfies ScaffoldAppAnswers;
}

/** Create the default commerce app config file content */
export async function getDefaultCommerceAppConfig(
  cwd: string,
  { appName, features }: ScaffoldAppAnswers,
) {
  const isEcmaScript = await isESM(cwd);
  const exportKeyword = isEcmaScript ? "export default" : "module.exports =";
  const importStatement = isEcmaScript
    ? 'import { defineConfig } from "@adobe/aio-commerce-lib-app/config";'
    : 'const { defineConfig } = require("@adobe/aio-commerce-lib-app/config");';

  const defaultConfig: Partial<CommerceAppConfig> = {
    metadata: {
      id: appName.toLowerCase().replace(/ /g, "-"),
      displayName: appName,
      version: "1.0.0",
      description:
        "A custom Adobe Commerce application. Fill description for your app.",
    },
  };

  if (features.has("businessConfig")) {
    defaultConfig.businessConfig = FEATURE_DEFAULTS.businessConfig;
  }

  if (features.has("eventing.commerce")) {
    defaultConfig.eventing = {
      commerce: FEATURE_DEFAULTS["eventing.commerce"],
    };
  }

  if (features.has("eventing.external")) {
    defaultConfig.eventing = {
      external: FEATURE_DEFAULTS["eventing.external"],
    };
  }

  const configContent = inspect(defaultConfig, { colors: false });
  return [
    importStatement,
    "",
    `${exportKeyword} defineConfig(${configContent})`,
  ].join("\n");
}
