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

/** biome-ignore-all lint/performance/noBarrelFile: This is the public API for the invoice-view-buttons entrypoint. */

/**
 * Request parsing, response builders, and ACL resource IDs for `commerce/backend-ui/2`
 * invoice view buttons registered under `adminUi.invoice.viewButtons`.
 * @packageDocumentation
 */

export { getInvoiceViewButtonAclResourceId } from "./acl-resource-id";
export {
  invoiceViewButtonErrorResponse,
  okInvoiceViewButtonResponse,
  parseInvoiceViewButtonRequest,
} from "./presets";
export { InvoiceViewButtonRequestSchema } from "./schema";

export type {
  InvoiceViewButtonErrorBody,
  InvoiceViewButtonRequest,
  InvoiceViewButtonSuccessBody,
} from "./types";
