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

import { nonEmptyStringValueSchema } from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

import { ADMIN_UI_GRID_ENTITIES } from "#api/lib/acl-resource-id";

/**
 * Grid identifier sent by Commerce on the `commerce/backend-ui/2` wire contract.
 *
 * Credit memo grids send `"creditmemo"` — not `"creditMemo"` — even though the corresponding
 * config key (`adminUi.creditMemo`) is camelCase; see the Commerce module's `CustomColumn::GRID_MAP`.
 *
 * @see {@link https://github.com/magento-commerce/adobe-commerce-backend-uix Magento module reference}
 */
export const GridTypeSchema = v.picklist(ADMIN_UI_GRID_ENTITIES);

/**
 * Schema for the JSON body Commerce POSTs to a grid column handler.
 *
 * Commerce sends one request per chunk of grid rows (currently up to 1000 IDs
 * per request). The upper bound is the Commerce side's contract and is not
 * enforced here.
 */
export const GridRequestSchema = v.object({
  gridType: GridTypeSchema,
  ids: v.pipe(
    v.array(nonEmptyStringValueSchema("id")),
    v.minLength(1, 'The value of "ids" must contain at least one entry'),
  ),
  requestId: nonEmptyStringValueSchema("requestId"),
});
