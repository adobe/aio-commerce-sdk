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

import {
  COMMERCE_PROVIDER_TYPE,
  EXTERNAL_PROVIDER_TYPE,
  generateInstanceId,
  getIoEventCode,
  getNamespacedEvent,
} from "#management/installation/events/utils";
import { createMockMetadata } from "#test/fixtures/eventing";

/** Shared cases for testing id/name lowercase normalization: [description, id, name, expected]. */
const nameNormalizationCases = [
  [
    "should join id and event name with a dot",
    "my-app",
    "observer.order_placed",
    "my-app.observer.order_placed",
  ],
  [
    "should lowercase the result when id contains uppercase",
    "MyApp",
    "observer.order_placed",
    "myapp.observer.order_placed",
  ],
  [
    "should lowercase the result when event name contains uppercase",
    "my-app",
    "Observer.Order_Placed",
    "my-app.observer.order_placed",
  ],
  [
    "should lowercase both parts when both contain uppercase",
    "MyApp",
    "Observer.OrderPlaced",
    "myapp.observer.orderplaced",
  ],
] as const;

const TEST_WORKSPACE_ID = "4567890123456789";

describe("generateInstanceId", () => {
  test.each([
    [
      "should produce a lowercase instance ID from metadata id and workspace id",
      "MyApp-Test",
      `myapp-test-${TEST_WORKSPACE_ID}`,
    ],
    [
      "should lowercase an already-lowercase metadata id",
      "my-app",
      `my-app-${TEST_WORKSPACE_ID}`,
    ],
    [
      "should normalize mixed-case metadata id to lowercase",
      "MyMixedApp",
      `mymixedapp-${TEST_WORKSPACE_ID}`,
    ],
  ] as const)("%s", (_desc, id, expected) => {
    expect(generateInstanceId(createMockMetadata(id), TEST_WORKSPACE_ID)).toBe(
      expected,
    );
  });

  test("should truncate metadata id to 200 characters before the workspace suffix", () => {
    const longId = "a".repeat(250);
    const expectedPrefix = "a".repeat(200);
    expect(
      generateInstanceId(createMockMetadata(longId), TEST_WORKSPACE_ID),
    ).toBe(`${expectedPrefix}-${TEST_WORKSPACE_ID}`);
  });

  test("should produce different instance IDs for the same app when workspace differs", () => {
    const metadata = createMockMetadata("my-app");
    expect(generateInstanceId(metadata, "workspace-a")).not.toBe(
      generateInstanceId(metadata, "workspace-b"),
    );
  });
});

describe("getNamespacedEvent", () => {
  test.each(nameNormalizationCases)("%s", (_desc, id, name, expected) => {
    expect(getNamespacedEvent(createMockMetadata(id), name)).toBe(expected);
  });
});

describe("getIoEventCode", () => {
  test("should prefix with com.adobe.commerce. for Commerce provider type", () => {
    expect(
      getIoEventCode("my-app.observer.order_placed", COMMERCE_PROVIDER_TYPE),
    ).toBe("com.adobe.commerce.my-app.observer.order_placed");
  });

  test("should return the name unchanged for external provider type", () => {
    expect(
      getIoEventCode("my-app.webhook.received", EXTERNAL_PROVIDER_TYPE),
    ).toBe("my-app.webhook.received");
  });

  test("should produce a fully lowercase event code when combined with a normalized namespaced event", () => {
    const metadata = createMockMetadata("MyApp");
    const namespacedEvent = getNamespacedEvent(
      metadata,
      "Observer.OrderPlaced",
    );
    expect(getIoEventCode(namespacedEvent, COMMERCE_PROVIDER_TYPE)).toBe(
      "com.adobe.commerce.myapp.observer.orderplaced",
    );
  });
});
