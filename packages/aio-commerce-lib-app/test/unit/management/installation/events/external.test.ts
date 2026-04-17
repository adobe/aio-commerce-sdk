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

import { describe, expect, test } from "vitest";

import { externalEventsStep } from "#management/installation/events/external";
import { isLeafStep } from "#management/installation/workflow/step";
import {
  configWithCommerceEventing,
  configWithExternalEventing,
  minimalValidConfig,
} from "#test/fixtures/config";

describe("externalEventsStep leaf step", () => {
  test("should be a leaf step with name and meta", () => {
    expect(isLeafStep(externalEventsStep)).toBe(true);
    expect(externalEventsStep.name).toBe("external");
    expect(externalEventsStep.meta).toEqual({
      install: {
        label: "Configure External Events",
        description: "Sets up I/O Events for external event sources",
      },
      uninstall: {
        label: "Remove External Events",
        description: "Removes I/O Events for external event sources",
      },
    });
  });

  test("should only run if eventing.external is defined", () => {
    expect.assert(externalEventsStep.when);

    expect(externalEventsStep.when(configWithExternalEventing)).toBe(true);
    expect(externalEventsStep.when(configWithCommerceEventing)).toBe(false);
    expect(externalEventsStep.when(minimalValidConfig)).toBe(false);
  });
});
