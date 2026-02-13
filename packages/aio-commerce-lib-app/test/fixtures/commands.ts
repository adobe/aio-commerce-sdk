// @ts-expect-error - Importing the template as a raw string for testing purposes.
import customScripts from "#templates/custom-scripts.js?raw";
// @ts-expect-error - Importing the template as a raw string for testing purposes.
import installationTemplate from "#templates/installation.js?raw";

export const templates = {
  installation: installationTemplate as string,
  customScripts: customScripts as string,
};
