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

import { resolveEffectiveConfig } from "./resolve-effective-config";

import type {
  BusinessConfigSchemaField,
  BusinessConfigSchemaValue,
} from "#modules/schema/types";
import type { ConfigContext } from "./types";

/** Returns the schema fields for which the predicate holds, given their effective value in the scope. */
export async function filterConfigurationFields(
  context: ConfigContext,
  predicate: (
    field: BusinessConfigSchemaField,
    value: BusinessConfigSchemaValue | undefined,
  ) => boolean,
  scopeArgs: unknown[],
): Promise<BusinessConfigSchemaField[]> {
  const { configData, schema } = await resolveEffectiveConfig(
    context,
    scopeArgs,
  );
  const values = new Map(
    configData.config.map((entry) => [entry.name, entry.value]),
  );
  return schema.filter((field) => predicate(field, values.get(field.name)));
}
