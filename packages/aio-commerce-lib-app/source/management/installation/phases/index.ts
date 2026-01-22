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

/** biome-ignore-all lint/performance/noBarrelFile: Convinience entry point for all phases */

import { eventsPhaseDefinition } from "./events";
import { webhooksPhaseDefinition } from "./webhooks";

/** All phase definitions in execution order. */
export const phaseDefinitions = [
  eventsPhaseDefinition,
  webhooksPhaseDefinition,
] as const;

/** Union type of all phase definitions. */
export type AnyPhaseDefinition = (typeof phaseDefinitions)[number];

/** Find a phase definition by name. */
export function findPhaseDefinition(
  name: string,
): AnyPhaseDefinition | undefined {
  return phaseDefinitions.find((d) => d.name === name);
}

export { eventsPhaseDefinition } from "./events";
export { webhooksPhaseDefinition } from "./webhooks";

export type {
  EventsPhase,
  EventsPhaseConfig,
  EventsPhaseContext,
} from "./events";
export type { WebhooksPhase, WebhooksPhaseConfig } from "./webhooks";
