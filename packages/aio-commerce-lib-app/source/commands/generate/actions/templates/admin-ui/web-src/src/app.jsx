import { createExtensionApp } from "@adobe/aio-commerce-lib-admin-ui/web";
import "@react-spectrum/s2/page.css";

import config from "#app.commerce.config";
import { MainPage } from "#web/pages/main-page";

createExtensionApp({
  metadata: {
    extensionId: config.metadata.id,
    title: config.metadata.displayName,
  },

  routes: [{ index: true, element: <MainPage /> }],
});
