// @ts-expect-error - Importing the template as a raw string for testing purposes.

// @ts-expect-error - Importing the template as a raw string for testing purposes.
import registrationTemplate from "#templates/admin-ui-sdk/registration.js?raw";
import appConfigTemplate from "#templates/app-management/app-config.js?raw";
// @ts-expect-error - Importing the template as a raw string for testing purposes.
import customScripts from "#templates/app-management/custom-scripts.js?raw";
// @ts-expect-error - Importing the template as a raw string for testing purposes.
import installationTemplate from "#templates/app-management/installation.js?raw";
// @ts-expect-error - Importing the template as a raw string for testing purposes.
import businessConfigTemplate from "#templates/business-configuration/config.js?raw";
// @ts-expect-error - Importing the template as a raw string for testing purposes.
import scopeTreeTemplate from "#templates/business-configuration/scope-tree.js?raw";

export const templates = {
  appConfig: appConfigTemplate as string,
  installation: installationTemplate as string,
  customScripts: customScripts as string,
  businessConfig: businessConfigTemplate as string,
  registration: registrationTemplate as string,
  scopeTree: scopeTreeTemplate as string,
};

/**
 * Creates a temp file structure for the action templates directory.
 * Use with `withTempFiles` to create an ephemeral templates dir for integration tests.
 */
export function makeTemplateFiles(): Record<string, string> {
  return {
    "app-management/app-config.js.template": templates.appConfig,
    "app-management/installation.js.template": templates.installation,
    "app-management/custom-scripts.js.template": templates.customScripts,
    "admin-ui-sdk/registration.js.template": templates.registration,
    "business-configuration/config.js.template": templates.businessConfig,
    "business-configuration/scope-tree.js.template": templates.scopeTree,
  };
}
