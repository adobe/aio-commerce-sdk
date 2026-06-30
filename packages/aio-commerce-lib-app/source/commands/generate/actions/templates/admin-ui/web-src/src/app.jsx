import { createExtensionApp } from "@adobe/aio-commerce-lib-admin-ui/web";
import "@react-spectrum/s2/page.css";

// `@adobe/aio-commerce-lib-app` keeps this alias pointed at your configuration.
import config from "#app.commerce.config";

import { MainPage } from "./pages/main-page";

createExtensionApp({
  metadata: {
    extensionId: config.metadata.id,
    title: config.metadata.displayName,
  },

  routes: [{ index: true, element: <MainPage /> }],
});
