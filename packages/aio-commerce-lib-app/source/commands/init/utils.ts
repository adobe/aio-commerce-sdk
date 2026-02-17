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

import { writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

import { inspect } from "@aio-commerce-sdk/common-utils/logging";
import { isESM } from "@aio-commerce-sdk/scripting-utils/project";
import {
  getOrCreateMap,
  getOrCreateSeq,
  readYamlFile,
} from "@aio-commerce-sdk/scripting-utils/yaml/helpers";
import consola from "consola";
import { colorize } from "consola/utils";
import { isMap } from "yaml";

import {
  APP_CONFIG_FILE,
  COMMERCE_APP_CONFIG_FILE,
  getExtensionPointFolderPath,
  INSTALL_YAML_FILE,
} from "#commands/constants";

import { DOMAIN_DEFAULTS } from "./constants";

import type { Document, YAMLSeq } from "yaml";
import type { CommerceAppConfig, CommerceAppConfigDomain } from "#config/index";

type ScaffoldAppAnswers = {
  appName: string;
  configFile: string;
  configFormat: "ts" | "js";
  domains: Set<CommerceAppConfigDomain>;
};

/** Prompt the user to scaffold a new Commerce App configuration. */
export async function promptForCommerceAppConfig() {
  const configFormat = await consola.prompt(
    "What format do you want to use for the config file?",
    {
      type: "select",
      default: "ts",
      initial: "ts",
      cancel: "reject",
      options: [
        { label: "TypeScript", value: "ts", hint: "Recommended" },
        { label: "JavaScript", value: "js" },
      ] as const,
    },
  );

  const appName = await consola.prompt("What is the name of your app?", {
    type: "text",
    placeholder: "Application Display Name",
    default: "My Application",
    cancel: "reject",
  });

  const featuresToAdd = await consola.prompt(
    `What features do you want to add to your app? ${colorize("gray", "Space to select/deselect, Enter to submit")}`,
    {
      type: "multiselect",
      initial: [],
      required: true,
      cancel: "reject",

      options: [
        { label: "Business Configuration", value: "businessConfig.schema" },
        { label: "Commerce Events", value: "eventing.commerce" },
        { label: "External Events", value: "eventing.external" },
        {
          label: "Custom Installation Steps",
          value: "installation.customInstallationSteps",
        },
      ] as const,
    },
  );

  const configFile = `${COMMERCE_APP_CONFIG_FILE}.${configFormat}`;
  const domains = new Set<CommerceAppConfigDomain>(
    // @ts-expect-error - The return type seems to be incorrect, a string array is returned from `.prompt()` for `multiselect`
    featuresToAdd as string[],
  );

  return {
    appName,
    configFile,
    domains,
    configFormat,
  } satisfies ScaffoldAppAnswers;
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
      id: appName.toLowerCase().replace(/ /g, "-"),
      displayName: appName,
      version: "1.0.0",
      description:
        "A custom Adobe Commerce application. Fill description for your app.",
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

  const configContent = inspect(defaultConfig, { colors: false });
  return [
    importStatement,
    "",
    `${exportKeyword} defineConfig(${configContent})`,
  ].join("\n");
}

/**
 * Add an extension point to the app config file.
 * @param extensionPointId - The id of the extension point.
 * @param rootDirectory - The root directory of the project.
 * @param commentBefore - The comment to add before the extension point include pair.
 */
export async function addExtensionPointToAppConfig(
  extensionPointId: string,
  rootDirectory: string,
  commentBefore: string,
) {
  const appConfigPath = join(rootDirectory, APP_CONFIG_FILE);
  const extensionPointFolderPath = join(
    rootDirectory,
    getExtensionPointFolderPath(extensionPointId),
  );

  let doc: Document;
  const includePath = relative(
    rootDirectory,
    join(extensionPointFolderPath, "ext.config.yaml"),
  );

  try {
    doc = await readYamlFile(appConfigPath);
  } catch (error) {
    const fallbackContent = `extensions:\n  ${extensionPointId}:\n    $include: "${includePath}"`;
    throw new Error(
      `Failed to parse ${APP_CONFIG_FILE}. \nPlease add manually: \n\n${fallbackContent}`,
      {
        cause: error,
      },
    );
  }

  if (doc.getIn(["extensions", extensionPointId, "$include"]) === includePath) {
    consola.success(
      `Extension "${extensionPointId}" already configured in ${APP_CONFIG_FILE}`,
    );

    return;
  }

  consola.info(
    `Adding extension "${extensionPointId}" to ${APP_CONFIG_FILE}...`,
  );

  const extensions = getOrCreateMap(doc, ["extensions"], {
    onBeforeCreate: (pair) => {
      pair.key.spaceBefore = true;
    },
  });

  const extension = getOrCreateMap(doc, ["extensions", extensionPointId], {
    onBeforeCreate: (pair) => {
      pair.key.spaceBefore = extensions.items.length > 0;
      pair.key.commentBefore = commentBefore;
    },
  });

  extension.set("$include", includePath);
  await writeFile(appConfigPath, doc.toString(), "utf-8");
}

/**
 * Add an extension point to the install.yaml file.
 * @param extensionPointId - The id of the extension point.
 * @param rootDirectory - The root directory of the project.
 * @param commentBefore - The comment to add before the extension point include pair.
 */
export async function addExtensionPointToInstallYaml(
  extensionPointId: string,
  rootDirectory: string,
  commentBefore: string,
) {
  const installYamlPath = join(rootDirectory, INSTALL_YAML_FILE);

  let doc: Document;
  let extensions: YAMLSeq;

  try {
    doc = await readYamlFile(installYamlPath);
    extensions = getOrCreateSeq(doc, ["extensions"], {
      onBeforeCreate: (pair) => {
        pair.key.spaceBefore = true;
      },
    });
  } catch (error) {
    const fallbackContent = `\nextensions:\n  - extensionPointId: ${extensionPointId}`;
    throw new Error(
      `Failed to parse ${INSTALL_YAML_FILE}. \nPlease add manually: \n\n${fallbackContent}`,
      {
        cause: error,
      },
    );
  }

  // Check if the extension is already configured
  if (
    extensions.items.some(
      (item) =>
        isMap(item) && item.get("extensionPointId") === extensionPointId,
    )
  ) {
    consola.success(
      `Extension "${extensionPointId}" already configured in ${INSTALL_YAML_FILE}`,
    );

    return;
  }

  consola.info(
    `Adding extension "${extensionPointId}" to ${INSTALL_YAML_FILE}...`,
  );

  const extension = doc.createPair("extensionPointId", extensionPointId);
  extension.key.spaceBefore = extensions.items.length > 0;
  extension.key.commentBefore = commentBefore;
  extensions.items.push(extension);

  await writeFile(installYamlPath, doc.toString(), "utf-8");
}
