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

import { describe, expect, test, vi } from "vitest";

import {
  defineBranchStep,
  defineLeafStep,
  isBranchStep,
  isLeafStep,
} from "#management/installation/workflow/step";

describe("defineLeafStep", () => {
  test("returns a step with type: 'leaf'", () => {
    const step = defineLeafStep({
      install: vi.fn(() => ({ result: "test" })),
      meta: { install: { label: "Test Step" } },
      name: "test-step",
    });

    expect(step.type).toBe("leaf");
  });

  test("preserves name, meta, when, and install properties", () => {
    const installFn = vi.fn(() => ({ result: "test" }));
    const whenFn = vi.fn((_config) => true);

    const step = defineLeafStep({
      install: installFn,
      meta: { install: { description: "A test step", label: "Test Step" } },
      name: "test-step",

      // @ts-expect-error It's for testing
      when: whenFn,
    });

    expect(step.name).toBe("test-step");
    expect(step.meta).toEqual({
      install: { description: "A test step", label: "Test Step" },
    });
    expect(step.when).toBe(whenFn);
    expect(step.install).toBe(installFn);
  });

  test("works with minimal options (just name, meta, install)", () => {
    const installFn = vi.fn(() => ({ result: "test" }));

    const step = defineLeafStep({
      install: installFn,
      meta: { install: { label: "Minimal Step" } },
      name: "minimal-step",
    });

    expect(step.type).toBe("leaf");
    expect(step.name).toBe("minimal-step");
    expect(step.meta).toEqual({ install: { label: "Minimal Step" } });
    expect(step.install).toBe(installFn);
    expect(step.when).toBeUndefined();
  });

  test("works with optional when condition", () => {
    const whenFn = vi.fn((_config) => true);

    const step = defineLeafStep({
      install: vi.fn(() => ({ result: "test" })),
      meta: { install: { label: "Conditional Step" } },
      name: "conditional-step",

      // @ts-expect-error It's for testing
      when: whenFn,
    });

    expect(step.when).toBe(whenFn);
  });
});

describe("defineBranchStep", () => {
  test("returns a step with type: 'branch'", () => {
    const step = defineBranchStep({
      children: [],
      meta: { install: { label: "Test Branch" } },
      name: "test-branch",
    });

    expect(step.type).toBe("branch");
  });

  test("preserves name, meta, when, context, and children properties", () => {
    const whenFn = vi.fn((_config) => true);
    const contextFn = vi.fn(() => ({ client: "mock" }));
    const childStep = defineLeafStep({
      install: vi.fn(() => ({ result: "test" })),
      meta: { install: { label: "Child" } },
      name: "child",
    });

    const step = defineBranchStep({
      children: [childStep],
      context: contextFn,
      meta: { install: { description: "A test branch", label: "Test Branch" } },
      name: "test-branch",

      // @ts-expect-error It's for testing
      when: whenFn,
    });

    expect(step.name).toBe("test-branch");
    expect(step.meta).toEqual({
      install: { description: "A test branch", label: "Test Branch" },
    });
    expect(step.when).toBe(whenFn);
    expect(step.context).toBe(contextFn);
    expect(step.children).toEqual([childStep]);
  });

  test("works with minimal options (just name, meta, children)", () => {
    const step = defineBranchStep({
      children: [],
      meta: { install: { label: "Minimal Branch" } },
      name: "minimal-branch",
    });

    expect(step.type).toBe("branch");
    expect(step.name).toBe("minimal-branch");
    expect(step.meta).toEqual({ install: { label: "Minimal Branch" } });
    expect(step.children).toEqual([]);
    expect(step.when).toBeUndefined();
    expect(step.context).toBeUndefined();
  });

  test("works with optional when and context", () => {
    const whenFn = vi.fn((_config) => true);
    const contextFn = vi.fn(() => ({ client: "mock" }));

    const step = defineBranchStep({
      children: [],
      context: contextFn,
      meta: { install: { label: "Optional Branch" } },
      name: "optional-branch",

      // @ts-expect-error It's for testing
      when: whenFn,
    });

    expect(step.when).toBe(whenFn);
    expect(step.context).toBe(contextFn);
  });
});

describe("isLeafStep", () => {
  test("returns true for leaf steps (type: 'leaf')", () => {
    const leafStep = defineLeafStep({
      install: vi.fn(() => ({ result: "test" })),
      meta: { install: { label: "Leaf" } },
      name: "leaf",
    });

    expect(isLeafStep(leafStep)).toBe(true);
  });

  test("returns false for branch steps (type: 'branch')", () => {
    const branchStep = defineBranchStep({
      children: [],
      meta: { install: { label: "Branch" } },
      name: "branch",
    });

    expect(isLeafStep(branchStep)).toBe(false);
  });
});

describe("isBranchStep", () => {
  test("returns true for branch steps (type: 'branch')", () => {
    const branchStep = defineBranchStep({
      children: [],
      meta: { install: { label: "Branch" } },
      name: "branch",
    });

    expect(isBranchStep(branchStep)).toBe(true);
  });

  test("returns false for leaf steps (type: 'leaf')", () => {
    const leafStep = defineLeafStep({
      install: vi.fn(() => ({ result: "test" })),
      meta: { install: { label: "Leaf" } },
      name: "leaf",
    });

    expect(isBranchStep(leafStep)).toBe(false);
  });
});
