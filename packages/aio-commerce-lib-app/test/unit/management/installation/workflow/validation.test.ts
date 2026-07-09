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
} from "#management/installation/workflow/step";
import { validateStepTree } from "#management/installation/workflow/validation";
import { minimalValidConfig } from "#test/fixtures/config";
import { createMockInstallationContext } from "#test/fixtures/installation";

const rootMeta = { label: "Root" };
const childMeta = { label: "Child" };
const context = createMockInstallationContext();

function makeRoot(
  children: ReturnType<typeof defineLeafStep | typeof defineBranchStep>[] = [],
) {
  return defineBranchStep({
    children,
    meta: { install: rootMeta },
    name: "root",
  });
}

describe("validateStepTree — result structure", () => {
  test("returns name, path, meta and empty issues/children for a leaf-only root", async () => {
    const rootStep = makeRoot();

    const { result } = await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    expect(result.name).toBe("root");
    expect(result.path).toEqual(["root"]);
    expect(result.meta).toEqual(rootMeta);
    expect(result.issues).toEqual([]);
    expect(result.children).toEqual([]);
  });

  test("child results carry name, path (root → child) and meta", async () => {
    const child = defineLeafStep({
      install: vi.fn(),
      meta: { install: childMeta },
      name: "step-a",
    });
    const rootStep = makeRoot([child]);

    const { result } = await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    expect(result.children).toHaveLength(1);
    expect(result.children[0].name).toBe("step-a");
    expect(result.children[0].path).toEqual(["root", "step-a"]);
    expect(result.children[0].meta).toEqual(childMeta);
  });
});

describe("validateStepTree — valid flag", () => {
  test("valid is true when there are no issues at any level", async () => {
    const rootStep = makeRoot();

    const { valid } = await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    expect(valid).toBe(true);
  });

  test("valid is false when root step has an error issue", async () => {
    const rootStep = defineBranchStep({
      children: [],
      meta: { install: rootMeta },
      name: "root",
      validate: async () => [
        { code: "ERR", message: "bad", severity: "error" },
      ],
    });

    const { valid } = await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    expect(valid).toBe(false);
  });

  test("valid is false when root step has a warning issue", async () => {
    const rootStep = defineBranchStep({
      children: [],
      meta: { install: rootMeta },
      name: "root",
      validate: async () => [
        { code: "WARN", message: "caution", severity: "warning" },
      ],
    });

    const { valid } = await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    expect(valid).toBe(false);
  });

  test("valid is false when a child step has an error issue", async () => {
    const child = defineLeafStep({
      install: vi.fn(),
      meta: { install: childMeta },
      name: "child",
      validate: async () => [
        { code: "CHILD_ERR", message: "child error", severity: "error" },
      ],
    });
    const rootStep = makeRoot([child]);

    const { valid } = await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    expect(valid).toBe(false);
  });
});

describe("validateStepTree — runStepValidation", () => {
  test("returns no issues when step has no validate handler", async () => {
    const child = defineLeafStep({
      install: vi.fn(),
      meta: { install: childMeta },
      name: "child",
    });
    const rootStep = makeRoot([child]);

    const { result } = await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    expect(result.children[0].issues).toEqual([]);
  });

  test("calls validate with config and context, and returns its issues", async () => {
    const validate = vi
      .fn()
      .mockResolvedValue([
        { code: "X", message: "msg", severity: "warning" as const },
      ]);
    const child = defineLeafStep({
      install: vi.fn(),
      meta: { install: childMeta },
      name: "child",
      validate,
    });
    const rootStep = makeRoot([child]);

    const { result } = await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    expect(validate).toHaveBeenCalledWith(
      minimalValidConfig,
      expect.objectContaining(context),
    );
    expect(result.children[0].issues).toEqual([
      { code: "X", message: "msg", severity: "warning" },
    ]);
  });

  test("catches Error thrown by validate and reports VALIDATION_HANDLER_ERROR", async () => {
    const child = defineLeafStep({
      install: vi.fn(),
      meta: { install: childMeta },
      name: "child",
      validate: async () => {
        throw new Error("boom");
      },
    });
    const rootStep = makeRoot([child]);

    const { result } = await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    expect(result.children[0].issues).toEqual([
      {
        code: "VALIDATION_HANDLER_ERROR",
        message: "boom",
        severity: "error",
      },
    ]);
  });

  test("catches non-Error thrown by validate and converts it to a string message", async () => {
    const child = defineLeafStep({
      install: vi.fn(),
      meta: { install: childMeta },
      name: "child",
      validate: async () => {
        // biome-ignore lint/style/useThrowOnlyError: intentional non-Error throw
        throw "string-error";
      },
    });
    const rootStep = makeRoot([child]);

    const { result } = await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    expect(result.children[0].issues[0]).toMatchObject({
      code: "VALIDATION_HANDLER_ERROR",
      message: "string-error",
      severity: "error",
    });
  });
});

describe("validateStepTree — resolveBranchContext", () => {
  test("passes parent context to children when branch step has no context factory", async () => {
    const validate = vi.fn().mockResolvedValue([]);
    const child = defineLeafStep({
      install: vi.fn(),
      meta: { install: childMeta },
      name: "child",
      validate,
    });
    const rootStep = makeRoot([child]);

    await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    expect(validate).toHaveBeenCalledWith(
      minimalValidConfig,
      expect.objectContaining({ logger: context.logger }),
    );
  });

  test("merges context factory output into child context", async () => {
    const validate = vi.fn().mockResolvedValue([]);
    const child = defineLeafStep({
      install: vi.fn(),
      meta: { install: childMeta },
      name: "child",
      validate,
    });
    const branch = defineBranchStep({
      children: [child],
      context: async (): Promise<Record<string, unknown>> => ({
        myClient: "injected-client",
      }),
      meta: { install: rootMeta },
      name: "root",
    });

    await validateStepTree({
      config: minimalValidConfig,
      rootStep: branch,
      validationContext: context,
    });

    expect(validate).toHaveBeenCalledWith(
      minimalValidConfig,
      expect.objectContaining({ myClient: "injected-client" }),
    );
  });

  test("catches Error from context factory and reports VALIDATION_CONTEXT_ERROR on the branch", async () => {
    // resolveBranchContext is only invoked when children.length > 0
    const child = defineLeafStep({
      install: vi.fn(),
      meta: { install: childMeta },
      name: "child",
    });
    const rootStep = defineBranchStep({
      children: [child],
      context: async (): Promise<Record<string, unknown>> => {
        throw new Error("context factory failed");
      },
      meta: { install: rootMeta },
      name: "root",
    });

    const { result } = await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    expect(result.issues).toContainEqual({
      code: "VALIDATION_CONTEXT_ERROR",
      message: "context factory failed",
      severity: "error",
    });
  });

  test("catches non-Error from context factory and converts it to a string message", async () => {
    // resolveBranchContext is only invoked when children.length > 0
    const child = defineLeafStep({
      install: vi.fn(),
      meta: { install: childMeta },
      name: "child",
    });
    const rootStep = defineBranchStep({
      children: [child],
      context: async (): Promise<Record<string, unknown>> => {
        // biome-ignore lint/style/useThrowOnlyError: intentional non-Error throw
        throw 42;
      },
      meta: { install: rootMeta },
      name: "root",
    });

    const { result } = await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    expect(result.issues[0]).toMatchObject({
      code: "VALIDATION_CONTEXT_ERROR",
      message: "42",
      severity: "error",
    });
  });

  test("falls back to parent context for children when context factory throws", async () => {
    const validate = vi.fn().mockResolvedValue([]);
    const child = defineLeafStep({
      install: vi.fn(),
      meta: { install: childMeta },
      name: "child",
      validate,
    });
    const rootStep = defineBranchStep({
      children: [child],
      context: async (): Promise<Record<string, unknown>> => {
        throw new Error("boom");
      },
      meta: { install: rootMeta },
      name: "root",
    });

    await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    // child is still validated using the parent context (no myClient injected)
    expect(validate).toHaveBeenCalledWith(
      minimalValidConfig,
      expect.not.objectContaining({ myClient: expect.anything() }),
    );
  });
});

describe("validateStepTree — when condition", () => {
  test("skips child whose when() returns false", async () => {
    const validate = vi.fn().mockResolvedValue([]);
    const child = defineLeafStep({
      install: vi.fn(),
      meta: { install: childMeta },
      name: "child",
      validate,
      // @ts-expect-error It's for testing
      when: () => false,
    });
    const rootStep = makeRoot([child]);

    const { result } = await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    expect(result.children).toHaveLength(0);
    expect(validate).not.toHaveBeenCalled();
  });

  test("includes child whose when() returns true", async () => {
    const child = defineLeafStep({
      install: vi.fn(),
      meta: { install: childMeta },
      name: "child",
      // @ts-expect-error It's for testing
      when: () => true,
    });
    const rootStep = makeRoot([child]);

    const { result } = await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    expect(result.children).toHaveLength(1);
  });

  test("includes children without a when condition", async () => {
    const child = defineLeafStep({
      install: vi.fn(),
      meta: { install: childMeta },
      name: "child",
    });
    const rootStep = makeRoot([child]);

    const { result } = await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    expect(result.children).toHaveLength(1);
  });

  test("includes only children whose when() is true when siblings differ", async () => {
    const included = defineLeafStep({
      install: vi.fn(),
      meta: { install: childMeta },
      name: "included",
      // @ts-expect-error - It's for testing
      when: () => true,
    });
    const excluded = defineLeafStep({
      install: vi.fn(),
      meta: { install: childMeta },
      name: "excluded",
      // @ts-expect-error - It's for testing
      when: () => false,
    });
    const rootStep = makeRoot([included, excluded]);

    const { result } = await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    expect(result.children).toHaveLength(1);
    expect(result.children[0].name).toBe("included");
  });
});

describe("validateStepTree — summary aggregation", () => {
  test("summary has zero counts when there are no issues", async () => {
    const { summary } = await validateStepTree({
      config: minimalValidConfig,
      rootStep: makeRoot(),
      validationContext: context,
    });

    expect(summary).toEqual({ errors: 0, totalIssues: 0, warnings: 0 });
  });

  test("counts errors from root step", async () => {
    const rootStep = defineBranchStep({
      children: [],
      meta: { install: rootMeta },
      name: "root",
      validate: async () => [
        { code: "A", message: "a", severity: "error" as const },
        { code: "B", message: "b", severity: "error" as const },
      ],
    });

    const { summary } = await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    expect(summary.errors).toBe(2);
    expect(summary.warnings).toBe(0);
    expect(summary.totalIssues).toBe(2);
  });

  test("counts warnings from root step", async () => {
    const rootStep = defineBranchStep({
      children: [],
      meta: { install: rootMeta },
      name: "root",
      validate: async () => [
        { code: "W", message: "w", severity: "warning" as const },
      ],
    });

    const { summary } = await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    expect(summary.errors).toBe(0);
    expect(summary.warnings).toBe(1);
    expect(summary.totalIssues).toBe(1);
  });

  test("does not count info-severity issues in totals", async () => {
    const child = defineLeafStep({
      install: vi.fn(),
      meta: { install: childMeta },
      name: "child",
      validate: async () => [
        { code: "INFO", message: "fyi", severity: "info" as const },
      ],
    });
    const rootStep = makeRoot([child]);

    const { summary } = await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    expect(summary.errors).toBe(0);
    expect(summary.warnings).toBe(0);
    expect(summary.totalIssues).toBe(0);
  });

  test("aggregates issues across root and all children", async () => {
    const child = defineLeafStep({
      install: vi.fn(),
      meta: { install: childMeta },
      name: "child",
      validate: async () => [
        {
          code: "CHILD_W",
          message: "child warning",
          severity: "warning" as const,
        },
      ],
    });
    const rootStep = defineBranchStep({
      children: [child],
      meta: { install: rootMeta },
      name: "root",
      validate: async () => [
        { code: "ROOT_E", message: "root error", severity: "error" as const },
      ],
    });

    const { summary } = await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    expect(summary.errors).toBe(1);
    expect(summary.warnings).toBe(1);
    expect(summary.totalIssues).toBe(2);
  });

  test("aggregates issues across deeply nested children", async () => {
    const grandchild = defineLeafStep({
      install: vi.fn(),
      meta: { install: { label: "Grandchild" } },
      name: "grandchild",
      validate: async () => [
        { code: "GC_E", message: "gc error", severity: "error" as const },
      ],
    });
    const branch = defineBranchStep({
      children: [grandchild],
      meta: { install: childMeta },
      name: "branch",
    });
    const rootStep = makeRoot([branch]);

    const { summary, result } = await validateStepTree({
      config: minimalValidConfig,
      rootStep,
      validationContext: context,
    });

    expect(summary.errors).toBe(1);
    // Verify nesting: root → branch → grandchild
    const [
      {
        children: [grandchildResult],
      },
    ] = result.children;
    expect(grandchildResult.name).toBe("grandchild");
    expect(grandchildResult.path).toEqual(["root", "branch", "grandchild"]);
    expect(grandchildResult.issues[0].code).toBe("GC_E");
  });
});
