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

/** biome-ignore-all lint/performance/noBarrelFile: This is the public API for the rma-view-buttons entrypoint. */

/**
 * Request parsing, response builders, and ACL resource IDs for `commerce/backend-ui/2`
 * return view buttons registered under `adminUi.rma.viewButtons`.
 * @packageDocumentation
 */

export { getRmaViewButtonAclResourceId } from "./acl-resource-id";
export {
  okRmaViewButtonResponse,
  parseRmaViewButtonRequest,
  rmaViewButtonErrorResponse,
} from "./presets";
export { RmaViewButtonRequestSchema } from "./schema";

export type {
  RmaViewButtonErrorBody,
  RmaViewButtonRequest,
  RmaViewButtonSuccessBody,
} from "./types";
