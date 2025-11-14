import { join } from "node:path";

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

/** The absolute path to the extension point folder. */
export const EXTENSION_POINT_FOLDER = join(
  process.cwd(),
  EXTENSION_POINT_FOLDER_NAME,
);

/** The name of the configuration schema file */
export const CONFIG_SCHEMA_FILE_NAME = "configuration-schema.json";
