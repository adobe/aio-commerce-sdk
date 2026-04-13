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
      name: "test-step",
      meta: { install: { label: "Test Step" } },
      install: vi.fn(() => ({ result: "test" })),
    });

    expect(step.type).toBe("leaf");
  });

  test("preserves name, meta, when, and install properties", () => {
    const installFn = vi.fn(() => ({ result: "test" }));
    const whenFn = vi.fn((_config) => true);

    const step = defineLeafStep({
      name: "test-step",
      meta: { install: { label: "Test Step", description: "A test step" } },
      install: installFn,

      // @ts-expect-error It's for testing
      when: whenFn,
    });

    expect(step.name).toBe("test-step");
    expect(step.meta).toEqual({
      install: { label: "Test Step", description: "A test step" },
    });
    expect(step.when).toBe(whenFn);
    expect(step.install).toBe(installFn);
  });

  test("works with minimal options (just name, meta, install)", () => {
    const installFn = vi.fn(() => ({ result: "test" }));

    const step = defineLeafStep({
      name: "minimal-step",
      meta: { install: { label: "Minimal Step" } },
      install: installFn,
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
      name: "conditional-step",
      meta: { install: { label: "Conditional Step" } },
      install: vi.fn(() => ({ result: "test" })),

      // @ts-expect-error It's for testing
      when: whenFn,
    });

    expect(step.when).toBe(whenFn);
  });
});

describe("defineBranchStep", () => {
  test("returns a step with type: 'branch'", () => {
    const step = defineBranchStep({
      name: "test-branch",
      meta: { install: { label: "Test Branch" } },
      children: [],
    });

    expect(step.type).toBe("branch");
  });

  test("preserves name, meta, when, context, and children properties", () => {
    const whenFn = vi.fn((_config) => true);
    const contextFn = vi.fn(() => ({ client: "mock" }));
    const childStep = defineLeafStep({
      name: "child",
      meta: { install: { label: "Child" } },
      install: vi.fn(() => ({ result: "test" })),
    });

    const step = defineBranchStep({
      name: "test-branch",
      meta: { install: { label: "Test Branch", description: "A test branch" } },
      context: contextFn,
      children: [childStep],

      // @ts-expect-error It's for testing
      when: whenFn,
    });

    expect(step.name).toBe("test-branch");
    expect(step.meta).toEqual({
      install: { label: "Test Branch", description: "A test branch" },
    });
    expect(step.when).toBe(whenFn);
    expect(step.context).toBe(contextFn);
    expect(step.children).toEqual([childStep]);
  });

  test("works with minimal options (just name, meta, children)", () => {
    const step = defineBranchStep({
      name: "minimal-branch",
      meta: { install: { label: "Minimal Branch" } },
      children: [],
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
      name: "optional-branch",
      meta: { install: { label: "Optional Branch" } },
      context: contextFn,
      children: [],

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
      name: "leaf",
      meta: { install: { label: "Leaf" } },
      install: vi.fn(() => ({ result: "test" })),
    });

    expect(isLeafStep(leafStep)).toBe(true);
  });

  test("returns false for branch steps (type: 'branch')", () => {
    const branchStep = defineBranchStep({
      name: "branch",
      meta: { install: { label: "Branch" } },
      children: [],
    });

    expect(isLeafStep(branchStep)).toBe(false);
  });
});

describe("isBranchStep", () => {
  test("returns true for branch steps (type: 'branch')", () => {
    const branchStep = defineBranchStep({
      name: "branch",
      meta: { install: { label: "Branch" } },
      children: [],
    });

    expect(isBranchStep(branchStep)).toBe(true);
  });

  test("returns false for leaf steps (type: 'leaf')", () => {
    const leafStep = defineLeafStep({
      name: "leaf",
      meta: { install: { label: "Leaf" } },
      install: vi.fn(() => ({ result: "test" })),
    });

    expect(isBranchStep(leafStep)).toBe(false);
  });
});
