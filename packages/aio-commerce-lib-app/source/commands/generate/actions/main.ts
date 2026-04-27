import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { consola } from "consola";
import { formatTree } from "consola/utils";
import { stringify } from "safe-stable-stringify";

import {
  BACKEND_UI_EXTENSION_POINT_ID,
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
  GENERATED_ACTIONS_PATH,
  getExtensionPointFolderPath,
  REGISTRATION_FILE_NAME,
} from "#commands/constants";
import { loadAppManifest } from "#commands/utils";
import { hasAdminUiSdk, hasBusinessConfigSchema } from "#config/index";

import { getRuntimeActions } from "./config";
import {
  buildAdminUiSdkExtConfig,
  buildAppManagementExtConfig,
  buildBusinessConfigurationExtConfig,
  CUSTOM_IMPORTS_PLACEHOLDER,
  CUSTOM_SCRIPTS_LOADER_PLACEHOLDER,
  CUSTOM_SCRIPTS_MAP_PLACEHOLDER,
  getRuntimeActions,
} from "./config";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/**
 * Runs the generate actions command for the given extension point.
 * @param appManifest - The app manifest, used to determine which actions to generate and their content.
 * @param templatesDir - The directory to load templates from, for testing purposes. Defaults to the generated actions template root.
 */
export async function run(
  appManifest: CommerceAppConfigOutputModel,
  templatesDir = TEMPLATES_DIR,
) {
  const appManagementExtConfig = await updateExtConfig(
    appManifest,
    EXTENSIBILITY_EXTENSION_POINT_ID,
  );

  await generateActionFiles(
    appManifest,
    getRuntimeActions(appManagementExtConfig, "app-management"),
    EXTENSIBILITY_EXTENSION_POINT_ID,
    templatesDir,
  );

  // If the app has a business configuration schema, generate the business configuration actions and files
  if (hasBusinessConfigSchema(appManifest)) {
    const businessConfigExtConfig = await updateExtConfig(
      appManifest,
      CONFIGURATION_EXTENSION_POINT_ID,
    );

    await generateActionFiles(
      appManifest,
      getRuntimeActions(businessConfigExtConfig, "business-configuration"),
      CONFIGURATION_EXTENSION_POINT_ID,
      templatesDir,
    );
  }

  if (hasAdminUiSdk(appManifest)) {
    await updateExtConfig(appManifest, BACKEND_UI_EXTENSION_POINT_ID);
    await generateRegistrationActionFile(
      appManifest,
      BACKEND_UI_EXTENSION_POINT_ID,
      templatesDir,
    );
  }
}

/** Run the generate actions command */
export async function exec() {
  try {
    const appManifest = await loadAppManifest();
    await run(appManifest);
  } catch (error) {
    if (error instanceof CommerceSdkValidationError) {
      consola.error(error.display());
    } else {
      consola.error(error);
    }
    process.exit(1);
  }
}

/** Update the ext.config.yaml file */
async function updateExtConfig(
  appConfig: CommerceAppConfigOutputModel,
  extensionPointId: ValidExtensionPointId,
) {
  consola.info(`Updating ext.config.yaml for ${extensionPointId}...`);
  const extensionPointFolderPath =
    getExtensionPointFolderPath(extensionPointId);

  const outputDir = await makeOutputDirFor(extensionPointFolderPath);
  const extConfigPath = join(outputDir, "ext.config.yaml");
  const extConfigDoc = await readYamlFile(extConfigPath);

  let extConfig: ExtConfig;
  switch (extensionPointId) {
    case EXTENSIBILITY_EXTENSION_POINT_ID: {
      extConfig = buildAppManagementExtConfig(appConfig);
      break;
    }

    case CONFIGURATION_EXTENSION_POINT_ID: {
      extConfig = buildBusinessConfigurationExtConfig();
      break;
    }

    case BACKEND_UI_EXTENSION_POINT_ID: {
      extConfig = buildAdminUiSdkExtConfig();
      break;
    }

    default: {
      throw new Error(`Unsupported extension point ID: ${extensionPointId}`);
    }
  }

  await createOrUpdateExtConfig(extConfigPath, extConfig, extConfigDoc);
  return extConfig;
}

/** Generate the action files */
async function generateActionFiles(
  appManifest: CommerceAppConfigOutputModel,
  actions: TemplateAction[],
  extensionPointId: ValidExtensionPointId,
) {
  consola.start("Generating runtime actions...");
  const extensionPointFolderPath =
    getExtensionPointFolderPath(extensionPointId);

  const outputDir = await makeOutputDirFor(
    join(extensionPointFolderPath, GENERATED_ACTIONS_PATH),
  );

  const outputFiles: string[] = [];
  const templatesDir = join(__dirname, "generate/actions/templates");

  for (const action of actions) {
    const templatePath = join(templatesDir, action.templateFile);
    let template = await readFile(templatePath, "utf-8");

    // For installation action, inject custom script imports
    if (action.name === "installation") {
      const customScriptsTemplatePath = join(
        templatesDir,
        "app-management",
        "custom-scripts.js.template",
      );

      const scriptsTemplate = await generateCustomScriptsTemplate(
        await readFile(customScriptsTemplatePath, "utf-8"),
        appManifest,
      );

      template = applyCustomScripts(template, scriptsTemplate);
    }

    const actionPath = join(outputDir, `${action.name}.js`);

    await writeFile(actionPath, template, "utf-8");
    outputFiles.push(` ${relative(process.cwd(), actionPath)}`);
  }

  consola.success(`Generated ${actions.length} action(s)`);
  consola.log.raw(formatTree(outputFiles));
}

/**
 * Applies the given custom scripts template code to the given installation template.
 * @param installationTemplate - The installation code runtime action template
 * @param customScriptsTemplate - The custom scripts dynamically generated template.
 */
export function applyCustomScripts(
  installationTemplate: string,
  customScriptsTemplate: string | null,
) {
  // There are scripts file to include.
  if (customScriptsTemplate !== null) {
    return installationTemplate
      .replace(CUSTOM_SCRIPTS_LOADER_PLACEHOLDER, customScriptsTemplate)
      .replace(
        "const args = { appConfig };",
        "const args = { appConfig, customScriptsLoader };",
      );
  }
  // No custom scripts, remove the loader references
  consola.debug(
    "No custom installation steps found, skipping custom-scripts.js generation...",
  );

  return installationTemplate.replace(
    CUSTOM_SCRIPTS_LOADER_PLACEHOLDER,
    "// No custom installation scripts configured",
  );
}

/**
 * Generate the installation template with dynamic custom script imports
 */
export async function generateCustomScriptsTemplate(
  template: string,
  appManifest: CommerceAppConfigOutputModel,
) {
  if (!hasCustomInstallationSteps(appManifest)) {
    return null;
  }

  // The generated installation action with will be at:
  // src/commerce-extensibility-1/.generated/actions/.generated/app-management
  // We need to resolve paths from project root to relative imports from this location
  const projectRoot = await getProjectRootDirectory();
  const installationActionDir = join(
    projectRoot,
    getExtensionPointFolderPath(EXTENSIBILITY_EXTENSION_POINT_ID),
    GENERATED_ACTIONS_PATH,
  );

  // Generate import statements
  const customSteps = appManifest.installation.customInstallationSteps;
  const importStatements = customSteps
    .map((step: CustomInstallationStep, index: number) => {
      // step.script is relative to project root (e.g., "./scripts/setup.js")
      const absoluteScriptPath = join(projectRoot, step.script);
      let relativeImportPath = relative(
        installationActionDir,
        absoluteScriptPath,
      );
      if (!relativeImportPath.startsWith(".")) {
        relativeImportPath = `./${relativeImportPath}`;
      }
      relativeImportPath = relativeImportPath.replace(/\\/g, "/");

      const importName = `customScript${index}`;
      return `import * as ${importName} from "${relativeImportPath}";`;
    })
    .join("\n");

  // Generate the loadCustomInstallationScripts function
  const scriptMap = customSteps
    .map((step: CustomInstallationStep, index: number) => {
      const scriptPath = step.script;
      const importName = `customScript${index}`;
      const entry = `"${scriptPath}": ${importName},`;

      return entry.padStart(entry.length + 6); // add indentation
    })
    .join("\n");

  // Inject imports and function into template
  const result = template.replace(CUSTOM_IMPORTS_PLACEHOLDER, importStatements);
  return result.replace(CUSTOM_SCRIPTS_MAP_PLACEHOLDER, scriptMap);
}

/**
 * Generates `registration/index.js` with the Admin UI SDK registration config inlined as a JS object literal.
 * @param appManifest - The validated app config; must satisfy `hasAdminUiSdk`.
 * @param extensionPointId - The extension point ID that owns the registration action.
 */
export async function generateRegistrationActionFile(
  appManifest: CommerceAppConfigOutputModel,
  extensionPointId: ValidExtensionPointId,
) {
  consola.start("Generating Admin UI SDK registration action...");
  const extensionPointFolderPath =
    getExtensionPointFolderPath(extensionPointId);
  const generatedDir = await makeOutputDirFor(
    join(extensionPointFolderPath, ".generated"),
  );

  const outputDir = await makeOutputDirFor(
    join(extensionPointFolderPath, ADMIN_UI_SDK_ACTIONS_PATH),
  );

  const templatePath = join(
    __dirname,
    "generate/actions/templates/admin-ui-sdk/registration.js.template",
  );
  const template = await readFile(templatePath, "utf-8");

  const registration = appManifest.adminUiSdk?.registration ?? {};
  const actionPath = join(outputDir, "index.js");
  const registrationPath = join(generatedDir, REGISTRATION_FILE_NAME);
  const registrationContents = stringify(registration, null, 2);
  const formattedContent = await prettierFormat(template, actionPath);

  await writeFile(actionPath, formattedContent, "utf-8");
  await writeFile(registrationPath, registrationContents, "utf-8");
  consola.success(
    `Generated registration action at ${relative(process.cwd(), actionPath)}`,
  );
}
