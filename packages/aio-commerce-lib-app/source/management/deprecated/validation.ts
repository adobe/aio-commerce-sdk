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

import { isBranchStep } from "#management/common/workflow/step";
import { toValidationResult } from "#management/common/workflow/validation";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  AnyStep,
  BranchStep,
  ValidationContext,
} from "#management/common/workflow/step";
import type {
  StepValidationResult,
  ValidationIssue,
  ValidationResult,
} from "#management/common/workflow/validation";

/** Options for running validation over the step tree. */
export type ValidateStepTreeOptions = {
  /** The root branch step to validate. */
  rootStep: BranchStep;

  /** Validation context (params, logger, appData). */
  validationContext: ValidationContext;

  /** The app configuration used to determine applicable steps. */
  config: CommerceAppConfigOutputModel;
};

/**
 * Runs validation over the full step tree, returning a structured result.
 *
 * - Skips steps whose domains are not represented in the configuration
 * - Calls each step's optional `validate` handler
 * - Sets up branch context factories before validating children
 * - Never throws; all errors from validate handlers are caught and reported as issues
 */
export async function validateStepTree(
  options: ValidateStepTreeOptions,
): Promise<ValidationResult> {
  const { rootStep, validationContext, config } = options;

  return toValidationResult(
    await validateStep(rootStep, config, validationContext, []),
  );
}

/** Recursively validates a single step and its children. */
async function validateStep(
  step: AnyStep,
  config: CommerceAppConfigOutputModel,
  context: ValidationContext & Record<string, unknown>,
  parentPath: string[],
): Promise<StepValidationResult> {
  const path = [...parentPath, step.name];
  const issues = await runStepValidation(step, config, context);
  const children: StepValidationResult[] = [];

  if (isBranchStep(step) && step.children.length > 0) {
    const resolved = await resolveBranchContext(step, context);
    issues.push(...resolved.issues);

    for (const child of step.children) {
      const predicate = child.isConfigured ?? child.when;
      if (predicate && !predicate(config)) {
        continue;
      }

      children.push(
        // biome-ignore lint/performance/noAwaitInLoops: sibling steps validate in declared order against the same resolved child context
        await validateStep(child, config, resolved.childContext, path),
      );
    }
  }

  return { children, issues, meta: step.meta.install, name: step.name, path };
}

/** Resolves the child context for a branch step, reporting errors as issues. */
async function resolveBranchContext(
  step: BranchStep,
  context: ValidationContext & Record<string, unknown>,
): Promise<{
  childContext: ValidationContext & Record<string, unknown>;
  issues: ValidationIssue[];
}> {
  if (!step.context) {
    return { childContext: context, issues: [] };
  }

  try {
    const stepContext = await step.context(context);
    return { childContext: { ...context, ...stepContext }, issues: [] };
  } catch (err) {
    return {
      childContext: context,
      issues: [
        {
          code: "VALIDATION_CONTEXT_ERROR",
          message: err instanceof Error ? err.message : String(err),
          severity: "error",
        },
      ],
    };
  }
}

/** Runs a step's validate handler, catching any thrown errors as issues. */
async function runStepValidation(
  step: AnyStep,
  config: CommerceAppConfigOutputModel,
  context: ValidationContext & Record<string, unknown>,
): Promise<ValidationIssue[]> {
  if (!step.validate) {
    return [];
  }

  try {
    return await step.validate(config, context);
  } catch (err) {
    return [
      {
        code: "VALIDATION_HANDLER_ERROR",
        message: err instanceof Error ? err.message : String(err),
        severity: "error",
      },
    ];
  }
}
