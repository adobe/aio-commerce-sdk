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

/** biome-ignore-all lint/performance/noBarrelFile: This is the public API for the web entrypoint. */

/**
 * Browser helpers for mounting `commerce/backend-ui/2` iframe apps.
 * @packageDocumentation
 */

export { useIms } from "#web/react/auth/context/ims-context.tsx";
export { useSharedContext } from "#web/react/commerce/context/shared-context.tsx";
export { useCommerce } from "#web/react/commerce/hooks/use-commerce";
export {
  useMassActionContext,
  useOrderViewButtonContext,
} from "#web/react/commerce/hooks/use-extension-context";
export { useHostConnection } from "#web/react/commerce/hooks/use-host-connection";
export { createExtensionApp } from "#web/react/create-extension-app.tsx";

export type { ImsContext } from "#web/react/auth/types";
export type {
  HostConnection,
  MassActionContext,
  OrderViewButtonContext,
  SharedContext,
} from "#web/react/commerce/types";
export type { CreateExtensionAppOptions } from "#web/react/create-extension-app.tsx";
export type {
  ExtensionAppRoutes,
  ExtensionRoute,
  IndexRoute,
} from "#web/react/routing/types";
