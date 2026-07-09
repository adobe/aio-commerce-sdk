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
 * Schema for the JSON body Commerce POSTs to an order view button handler.
 *
 * `id` identifies the specific button that was clicked, letting a single
 * handler serve multiple buttons by branching on it. `orderId` is the
 * single order currently being viewed.
 */
export const OrderViewButtonRequestSchema = v.object({
  id: nonEmptyStringValueSchema("id"),
  orderId: nonEmptyStringValueSchema("orderId"),
  requestId: nonEmptyStringValueSchema("requestId"),
});
