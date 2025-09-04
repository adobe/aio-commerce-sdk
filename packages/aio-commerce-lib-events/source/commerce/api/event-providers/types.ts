import type { CamelCasedPropertiesDeep } from "type-fest";

/** Defines the structure of a Commerce event provider. */
export type CommerceEventProvider = {
  id: string;
  provider_id: string;
  instance_id?: string;
  label?: string;
  description?: string;
  workspace_configuration?: string;
};

/** Defines the fields of an event provider entity returned by the Commerce API. */
export type CommerceEventProviderOneResponse =
  CamelCasedPropertiesDeep<CommerceEventProvider>;

/** Defines the fields of many event provider entities returned by the Commerce API. */
export type CommerceEventProviderManyResponse =
  CommerceEventProviderOneResponse[];
