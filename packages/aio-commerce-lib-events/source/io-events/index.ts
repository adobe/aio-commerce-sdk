/** biome-ignore-all lint/performance/noBarrelFile: This is the package `io-events` entrypoint. */

export * from "./api/event-metadata/endpoints";
export * from "./api/event-providers/endpoints";
export * from "./api/event-providers/shorthands";
export * from "./lib/api-client";

export type * from "./api/event-metadata/schema";
export type {
  IoEventMetadata,
  IoEventMetadataManyResponse,
  IoEventMetadataOneResponse,
} from "./api/event-metadata/types";
export type * from "./api/event-providers/schema";
export type {
  IoEventProvider,
  IoEventProviderManyResponse,
  IoEventProviderOneResponse,
} from "./api/event-providers/types";
