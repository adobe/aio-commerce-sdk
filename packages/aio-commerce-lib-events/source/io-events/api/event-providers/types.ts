import type { CamelCasedPropertiesDeep } from "type-fest";
import type { IoEventMetadataHalModel } from "#io-events/api/event-metadata/types";
import type { HALLink } from "#io-events/types";

/** Defines the base fields of an I/O event provider entity. */
export type IoEventProvider = {
  id: string;
  instance_id?: string;
  label: string;
  source: string;
  publisher: string;
  provider_metadata: string;
  event_delivery_format: string;
  description?: string;
  docs_url?: string;
};

/** Defines the fields of an I/O event provider entity returned by the Adobe I/O Events API. */
export type IoEventProviderHalModel = IoEventProvider & {
  _embedded?: {
    eventmetadata: IoEventMetadataHalModel[];
  };
  _links: {
    self: HALLink;
    "rel:eventmetadata"?: HALLink;
  };
};

/** Defines the fields of an I/O event provider entity returned by the Adobe I/O Events API. */
export type IoEventProviderOneResponse =
  CamelCasedPropertiesDeep<IoEventProviderHalModel>;

/** Defines the fields of many I/O event provider entities returned by the Adobe I/O Events API. */
export type IoEventProviderManyResponse = CamelCasedPropertiesDeep<{
  _embedded: {
    providers: IoEventProviderHalModel[];
  };
  _links: {
    self: HALLink;
  };
}>;
