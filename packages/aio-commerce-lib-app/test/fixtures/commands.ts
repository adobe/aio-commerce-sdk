// @ts-expect-error - Importing the template as a raw string for testing purposes.
import webSrcIndexCss from "#templates/admin-ui/web-src/index.css?raw";
// @ts-expect-error - Importing the template as a raw string for testing purposes.
import webSrcIndexHtml from "#templates/admin-ui/web-src/index.html?raw";
// @ts-expect-error - Importing the template as a raw string for testing purposes.
import webSrcApp from "#templates/admin-ui/web-src/src/app.jsx?raw";
// @ts-expect-error - Importing the template as a raw string for testing purposes.
import webSrcWelcome from "#templates/admin-ui/web-src/src/components/welcome.jsx?raw";
// @ts-expect-error - Importing the template as a raw string for testing purposes.
import webSrcMainPage from "#templates/admin-ui/web-src/src/pages/main-page.jsx?raw";
// @ts-expect-error - Importing the template as a raw string for testing purposes.
import appConfigTemplate from "#templates/app-management/app-config.js?raw";
// @ts-expect-error - Importing the template as a raw string for testing purposes.
import associationTemplate from "#templates/app-management/association.js?raw";
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
  association: associationTemplate as string,
  installation: installationTemplate as string,
  customScripts: customScripts as string,
  businessConfig: businessConfigTemplate as string,
  scopeTree: scopeTreeTemplate as string,
  webSrcApp: webSrcApp as string,
  webSrcIndexCss: webSrcIndexCss as string,
  webSrcIndexHtml: webSrcIndexHtml as string,
  webSrcMainPage: webSrcMainPage as string,
  webSrcWelcome: webSrcWelcome as string,
};

/**
 * Creates a temp file structure for the action templates directory.
 * Use with `withTempFiles` to create an ephemeral templates dir for integration tests.
 */
export function makeTemplateFiles(): Record<string, string> {
  return {
    "app-management/app-config.js.template": templates.appConfig,
    "app-management/association.js.template": templates.association,
    "app-management/installation.js.template": templates.installation,
    "app-management/custom-scripts.js.template": templates.customScripts,
    "business-configuration/config.js.template": templates.businessConfig,
    "business-configuration/scope-tree.js.template": templates.scopeTree,
    "admin-ui/web-src/index.html": templates.webSrcIndexHtml,
    "admin-ui/web-src/index.css": templates.webSrcIndexCss,
    "admin-ui/web-src/src/app.jsx": templates.webSrcApp,
    "admin-ui/web-src/src/components/welcome.jsx": templates.webSrcWelcome,
    "admin-ui/web-src/src/pages/main-page.jsx": templates.webSrcMainPage,
  };
}
