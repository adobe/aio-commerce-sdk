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

import { describe, test } from "vitest";

describe("events installation module", () => {
  describe("eventingStep branch step", () => {
    test.todo("should be a branch step with correct name and meta");
    test.todo("should only run if eventing is defined");
    test.todo("should have commerce and external leaf steps");
  });

  describe("commerceEventsStep leaf step", () => {
    test.todo("should be a leaf step with name and meta");
    test.todo("should only run if eventing.commerce is defined");
    test.todo("should create entities");
  });

  describe("externalEventsStep leaf step", () => {
    test.todo("should be a leaf step with name and meta");
    test.todo("should only run if eventing.external is defined");
    test.todo("should create entities");
  });

  describe("createEventsStepContext", () => {
    test.todo("should create lazy ioEventsClient");
    test.todo("should create lazy commerceEventsClient");
  });
});
