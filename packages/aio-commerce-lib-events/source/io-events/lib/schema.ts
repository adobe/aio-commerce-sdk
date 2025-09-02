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
