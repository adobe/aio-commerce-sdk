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

// @ts-expect-error - Importing the template as a raw string for testing purposes.
import webSrcBabelConfig from "#templates/admin-ui/web-src/.babelrc?raw";
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
import appConfigTemplate from "../../source/commands/generate/actions/templates/app-management/app-config.js.template?raw";
// @ts-expect-error - Importing the template as a raw string for testing purposes.
import associationTemplate from "../../source/commands/generate/actions/templates/app-management/association.js.template?raw";
// @ts-expect-error - Importing the template as a raw string for testing purposes.
import customScripts from "../../source/commands/generate/actions/templates/app-management/custom-scripts.js.template?raw";
// @ts-expect-error - Importing the template as a raw string for testing purposes.
import installationTemplate from "../../source/commands/generate/actions/templates/app-management/installation.js.template?raw";
// @ts-expect-error - Importing the template as a raw string for testing purposes.
import businessConfigTemplate from "../../source/commands/generate/actions/templates/business-configuration/config.js.template?raw";
// @ts-expect-error - Importing the template as a raw string for testing purposes.
import scopeTreeTemplate from "../../source/commands/generate/actions/templates/business-configuration/scope-tree.js.template?raw";

export const templates = {
  appConfig: appConfigTemplate as string,
  association: associationTemplate as string,
  businessConfig: businessConfigTemplate as string,
  customScripts: customScripts as string,
  installation: installationTemplate as string,
  scopeTree: scopeTreeTemplate as string,
  webSrcApp: webSrcApp as string,
  webSrcBabelConfig: webSrcBabelConfig as string,
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
    "admin-ui/web-src/.babelrc": templates.webSrcBabelConfig,
    "admin-ui/web-src/index.css": templates.webSrcIndexCss,
    "admin-ui/web-src/index.html": templates.webSrcIndexHtml,
    "admin-ui/web-src/src/app.jsx": templates.webSrcApp,
    "admin-ui/web-src/src/components/welcome.jsx": templates.webSrcWelcome,
    "admin-ui/web-src/src/pages/main-page.jsx": templates.webSrcMainPage,
    "app-management/app-config.js.template": templates.appConfig,
    "app-management/association.js.template": templates.association,
    "app-management/custom-scripts.js.template": templates.customScripts,
    "app-management/installation.js.template": templates.installation,
    "business-configuration/config.js.template": templates.businessConfig,
    "business-configuration/scope-tree.js.template": templates.scopeTree,
  };
}
