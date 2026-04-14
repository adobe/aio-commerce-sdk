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

import { isBranchStep } from "./step";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  AnyStep,
  BranchStep,
  StepMetaInfo,
  ValidationContext,
  ValidationIssue,
} from "./step";

export type { ValidationIssue } from "./step";

/** Validation result for a single step, mirroring the step hierarchy. */
export type StepValidationResult = {
  /** Step name (unique among siblings). */
  name: string;

  /** Full path from root to this step. */
  path: string[];

  /** Step metadata (for display purposes). */
  meta: StepMetaInfo;

  /** Issues found for this specific step (not including children). */
  issues: ValidationIssue[];

  /** Validation results for child steps (empty for leaf steps). */
  children: StepValidationResult[];
};

/** Aggregated summary counts across the entire validation tree. */
export type ValidationSummary = {
  /** Total number of issues across all steps. */
  totalIssues: number;

  /** Number of error-severity issues (these block installation). */
  errors: number;

  /** Number of warning-severity issues (allow proceeding with confirmation). */
  warnings: number;
};

/** The complete validation result returned by the validation endpoint. */
export type ValidationResult = {
  /**
   * Whether installation can proceed without any confirmation.
   * False if there are any error or warning severity issues.
   */
  valid: boolean;

  /** The full validation tree mirroring the step structure. */
  result: StepValidationResult;

  /** Flat summary of issue counts for quick frontend decisions. */
  summary: ValidationSummary;
};

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
 * - Respects `when` conditions (skips steps that don't apply to the config)
 * - Calls each step's optional `validate` handler
 * - Sets up branch context factories before validating children
 * - Never throws; all errors from validate handlers are caught and reported as issues
 */
export async function validateStepTree(
  options: ValidateStepTreeOptions,
): Promise<ValidationResult> {
  const { rootStep, validationContext, config } = options;

  const result = await validateStep(rootStep, config, validationContext, []);
  const summary = aggregateSummary(result);

  return {
    valid: summary.errors === 0 && summary.warnings === 0,
    result,
    summary,
  };
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
      if (child.when && !child.when(config)) {
        continue;
      }

      children.push(
        await validateStep(child, config, resolved.childContext, path),
      );
    }
  }

  return { name: step.name, path, meta: step.meta.install, issues, children };
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

/** Recursively aggregates issue counts across the full validation tree. */
function aggregateSummary(result: StepValidationResult): ValidationSummary {
  let errors = 0;
  let warnings = 0;

  for (const issue of result.issues) {
    if (issue.severity === "error") {
      errors++;
    } else if (issue.severity === "warning") {
      warnings++;
    }
  }

  for (const child of result.children) {
    const childSummary = aggregateSummary(child);
    errors += childSummary.errors;
    warnings += childSummary.warnings;
  }

  return {
    totalIssues: errors + warnings,
    errors,
    warnings,
  };
}
