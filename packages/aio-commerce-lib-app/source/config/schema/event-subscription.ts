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

/** biome-ignore-all lint/style/noExportedImports: We are doing both, importing to use and re-exporting it. */
/** biome-ignore-all lint/performance/noBarrelFile: We want to have all the schema exports in one file. */

import * as v from "valibot";

/** Schema for an event subscription configuration */
export const EventSchema = v.object({
  name: v.pipe(
    v.string("Expected a string for the event name"),
    v.nonEmpty("The event name must not be empty"),
  ),
  fields: v.variant("type", [
    v.object({
      type: v.literal("all", "Expected the type to be 'all'"),
    }),
    v.object({
      type: v.literal("subset", "Expected the type to be 'subset'"),
      names: v.array(
        v.pipe(
          v.string("Expected a string for the field name"),
          v.nonEmpty("The field name must not be empty"),
        ),
        "Expected an array of field names",
      ),
    }),
  ]),
});

/** The input type inferred from the `EventSchema` schema. */
export type EventSchemaInput = v.InferInput<typeof EventSchema>;

/** The keys of the `eventSubscription` settings in the extensibility config file. */
export type EventSubscriptionConfig = {
  provider: string;
  /**
   * The schema of the app business configuration.
   * @default {}
   */
  event: EventSchemaInput;
};

/** Schema for event subscription configuration */
export const SchemaEventSubscription = v.object({
  provider: v.pipe(
    v.string("Expected a string for the event name"),
    v.nonEmpty("The event name must not be empty"),
  ),
  event: EventSchema,
}) satisfies v.GenericSchema<EventSubscriptionConfig>;
