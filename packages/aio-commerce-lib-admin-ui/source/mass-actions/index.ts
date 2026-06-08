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

/** biome-ignore-all lint/performance/noBarrelFile: This is the public API for the mass-actions entrypoint. */

/**
 * Builders for the `commerce/backend-ui/2` mass action wire contract.
 *
 * - **Worker actions**: request parsing and response envelope construction for
 *   runtime actions registered under `adminUi.<entity>.massActions` with
 *   `type: "worker"`.
 * - **View actions**: `selection` query parameter parsing for the App Builder
 *   SPA rendered by `type: "view"` mass actions.
 *
 * @packageDocumentation
 */

export { parseMassActionSelection } from "./view/presets";
export { MassActionSelectionSchema } from "./view/schema";
export {
  errorMassActionResponse,
  okMassActionResponse,
  parseMassActionRequest,
} from "./worker/presets";
export {
  MassActionGridTypeSchema,
  MassActionRequestSchema,
} from "./worker/schema";

export type { MassActionSelection } from "./view/types";
export type {
  MassActionErrorBody,
  MassActionGridType,
  MassActionRequest,
  MassActionSuccessBody,
} from "./worker/types";
