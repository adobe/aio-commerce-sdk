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

import { getSubscriptionChangeKind } from "#management/domains/events/comparison";

import type { CommerceEvent } from "#config/schema/eventing";

describe("getSubscriptionChangeKind", () => {
  function commerceEvent(
    overrides: Partial<CommerceEvent> = {},
  ): CommerceEvent {
    return {
      description: "An event",
      fields: [{ name: "field_a" }],
      label: "Event",
      name: "observer.order_placed",
      runtimeActions: ["my-package/my-action"],
      ...overrides,
    } as CommerceEvent;
  }

  test("returns 'none' for identical config", () => {
    expect(getSubscriptionChangeKind(commerceEvent(), commerceEvent())).toBe(
      "none",
    );
  });

  test("returns 'none' when fields are only reordered", () => {
    const baseline = commerceEvent({
      fields: [{ name: "field_a" }, { name: "field_b" }],
    });
    const target = commerceEvent({
      fields: [{ name: "field_b" }, { name: "field_a" }],
    });
    expect(getSubscriptionChangeKind(baseline, target)).toBe("none");
  });

  test("returns 'none' when rules are only reordered", () => {
    const baseline = commerceEvent({
      rules: [
        { field: "a", operator: "equal", value: "1" },
        { field: "b", operator: "equal", value: "2" },
      ],
    });
    const target = commerceEvent({
      rules: [
        { field: "b", operator: "equal", value: "2" },
        { field: "a", operator: "equal", value: "1" },
      ],
    });
    expect(getSubscriptionChangeKind(baseline, target)).toBe("none");
  });

  test("keeps a current value the target leaves out when no config set it", () => {
    const current = commerceEvent({ priority: true });
    expect(getSubscriptionChangeKind(current, commerceEvent())).toBe("none");
  });

  test("returns 'replace' when the target leaves out a value a config set", () => {
    const current = commerceEvent({ priority: true });
    expect(
      getSubscriptionChangeKind(current, commerceEvent(), [{ priority: true }]),
    ).toBe("replace");
  });

  test("returns 'replace' when the target leaves out rules a config set", () => {
    const rules = [{ field: "a", operator: "equal" as const, value: "1" }];
    const current = commerceEvent({ rules });
    expect(
      getSubscriptionChangeKind(current, commerceEvent(), [{ rules }]),
    ).toBe("replace");
  });

  test("returns 'replace' when the target drops a field's source", () => {
    const current = commerceEvent({
      fields: [{ name: "field_a", source: "extension_attributes.foo" }],
    });
    expect(getSubscriptionChangeKind(current, commerceEvent())).toBe("replace");
  });

  test("returns 'in-place' when a field is added", () => {
    const target = commerceEvent({
      fields: [{ name: "field_a" }, { name: "field_b" }],
    });
    expect(getSubscriptionChangeKind(commerceEvent(), target)).toBe("in-place");
  });

  test("returns 'in-place' when a field's source changes (same name)", () => {
    const baseline = commerceEvent({ fields: [{ name: "field_a" }] });
    const target = commerceEvent({
      fields: [{ name: "field_a", source: "extension_attributes.foo" }],
    });
    expect(getSubscriptionChangeKind(baseline, target)).toBe("in-place");
  });

  test("returns 'in-place' when a rule is added", () => {
    const target = commerceEvent({
      rules: [{ field: "state", operator: "equal", value: "new" }],
    });
    expect(getSubscriptionChangeKind(commerceEvent(), target)).toBe("in-place");
  });

  test("returns 'in-place' when a rule value changes (same field:operator)", () => {
    const baseline = commerceEvent({
      rules: [{ field: "state", operator: "equal", value: "old" }],
    });
    const target = commerceEvent({
      rules: [{ field: "state", operator: "equal", value: "new" }],
    });
    expect(getSubscriptionChangeKind(baseline, target)).toBe("in-place");
  });

  test("returns 'in-place' when priority is toggled", () => {
    const target = commerceEvent({ priority: true });
    expect(getSubscriptionChangeKind(commerceEvent(), target)).toBe("in-place");
  });

  test("returns 'in-place' when hipaa_audit_required is toggled", () => {
    const target = commerceEvent({ hipaa_audit_required: true });
    expect(getSubscriptionChangeKind(commerceEvent(), target)).toBe("in-place");
  });

  // Disabling a scalar (true -> false) drops no field/rule key, so it classifies as `in-place`
  // like the enabling direction above. The in-place path relies on the Commerce merge endpoint
  // applying a `false` scalar.
  test("returns 'in-place' when priority is disabled (true -> false)", () => {
    const baseline = commerceEvent({ priority: true });
    const target = commerceEvent({ priority: false });
    expect(getSubscriptionChangeKind(baseline, target)).toBe("in-place");
  });

  test("returns 'in-place' when hipaa_audit_required is disabled (true -> false)", () => {
    const baseline = commerceEvent({ hipaa_audit_required: true });
    const target = commerceEvent({ hipaa_audit_required: false });
    expect(getSubscriptionChangeKind(baseline, target)).toBe("in-place");
  });

  test("returns 'replace' when a field is removed", () => {
    const baseline = commerceEvent({
      fields: [{ name: "field_a" }, { name: "field_b" }],
    });
    const target = commerceEvent({ fields: [{ name: "field_a" }] });
    expect(getSubscriptionChangeKind(baseline, target)).toBe("replace");
  });

  test("returns 'replace' when a field is renamed", () => {
    const baseline = commerceEvent({ fields: [{ name: "field_a" }] });
    const target = commerceEvent({ fields: [{ name: "field_b" }] });
    expect(getSubscriptionChangeKind(baseline, target)).toBe("replace");
  });

  test("returns 'replace' when a rule is removed", () => {
    const baseline = commerceEvent({
      rules: [
        { field: "a", operator: "equal", value: "1" },
        { field: "b", operator: "equal", value: "2" },
      ],
    });
    const target = commerceEvent({
      rules: [{ field: "a", operator: "equal", value: "1" }],
    });
    expect(getSubscriptionChangeKind(baseline, target)).toBe("replace");
  });

  test("returns 'replace' when a rule operator changes for the same field", () => {
    const baseline = commerceEvent({
      rules: [{ field: "state", operator: "equal", value: "1" }],
    });
    const target = commerceEvent({
      rules: [{ field: "state", operator: "greaterThan", value: "1" }],
    });
    expect(getSubscriptionChangeKind(baseline, target)).toBe("replace");
  });
});
