/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import * as v from "valibot";

/**
 * The provider types that this library is able to handle.
 * We deliberately don't support any other provider types.
 */
const VALID_EVENT_PROVIDER_TYPES = [
  "dx_commerce_events",
  "3rd_party_custom_events",
] as const;

/** The data residency regions that this I/O Events API supports. */
const VALID_DATA_RESIDENCY_REGIONS = ["va6", "irl1"] as const;

export const EventProviderTypeSchema = v.picklist(VALID_EVENT_PROVIDER_TYPES);
export const DataResidencyRegionSchema = v.picklist(
  VALID_DATA_RESIDENCY_REGIONS,
);

/** Defines either a Commerce or 3rd Party Custom Events provider. */
export type EventProviderType = v.InferOutput<typeof EventProviderTypeSchema>;

/** The data residency region of the event provider. */
export type DataResidencyRegion = v.InferOutput<
  typeof DataResidencyRegionSchema
>;
