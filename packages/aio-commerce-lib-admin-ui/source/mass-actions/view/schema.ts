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
 * Schema for the `selection` query parameter Commerce appends to the iframe URL
 * of a view mass action.
 *
 * Commerce serializes the selection as a JSON-encoded string:
 * `?selection={"ids":["000000001"],"gridType":"customer"}`
 */
export const MassActionSelectionSchema = v.object({
  gridType: v.picklist(["order", "product", "customer"]),
  ids: v.pipe(
    v.array(nonEmptyStringValueSchema("id")),
    v.minLength(1, 'The value of "ids" must contain at least one entry'),
  ),
});
