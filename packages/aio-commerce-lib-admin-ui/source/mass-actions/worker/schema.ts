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

/**
 * Grid identifier sent by Commerce on the `commerce/backend-ui/2` wire contract
 * for worker mass actions.
 */
export const MassActionGridTypeSchema = v.picklist([
  "order",
  "product",
  "customer",
]);

/**
 * Schema for the JSON body Commerce POSTs to a worker mass action handler.
 *
 * Commerce sends one request per chunk of selected IDs (currently up to 1000
 * IDs per request). The upper bound is the Commerce side's contract and is not
 * enforced here.
 */
export const MassActionRequestSchema = v.object({
  gridType: MassActionGridTypeSchema,
  requestId: nonEmptyStringValueSchema("requestId"),
  selectedIds: v.pipe(
    v.array(nonEmptyStringValueSchema("id")),
    v.minLength(
      1,
      'The value of "selectedIds" must contain at least one entry',
    ),
  ),
});
