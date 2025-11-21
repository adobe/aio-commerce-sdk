/** The name of the package containing all the generated runtime actions */
export const PACKAGE_NAME = "app-management";

/** The path to the directory containing the generated files */
export const GENERATED_PATH = ".generated";

/** The folder name containing the runtime actions */
export const ACTIONS_FOLDER = `actions/${PACKAGE_NAME}`;

/** The path to the directory containing the generated actions */
export const GENERATED_ACTIONS_PATH = `${GENERATED_PATH}/${ACTIONS_FOLDER}`;

/** The name of the extension point id. */
export const EXTENSION_POINT_ID = "commerce/configuration/1";

/** The folder name of the extension point. */
export const EXTENSION_POINT_FOLDER_NAME = EXTENSION_POINT_ID.replaceAll(
  "/",
  "-",
);

/** The path to the directory containing the extension point folder */
export const EXTENSION_POINT_FOLDER_PATH = `src/${EXTENSION_POINT_FOLDER_NAME}`;

/** The name of the configuration schema file */
export const CONFIG_SCHEMA_FILE_NAME = "configuration-schema.json";

/** The name of the extensibility configuration file */
export const EXTENSIBILITY_CONFIG_FILE = "extensibility.config.js";

/** The name of the project package file */
export const PACKAGE_JSON_FILE = "package.json";

/** The name of the app configuration file */
export const APP_CONFIG_FILE = "app.config.yaml";

/** The name of the environment configuration file */
export const ENV_FILE = ".env";

/** The name of the install configuration file */
export const INSTALL_YAML_FILE = "install.yaml";
