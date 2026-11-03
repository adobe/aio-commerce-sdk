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

import type { StepMetaInfo } from "./step";

/** Severity level of a validation issue. */
export type ValidationIssueSeverity = "error" | "warning" | "info";

/** A single validation issue reported by a step's validation. */
export type ValidationIssue = {
  /** Machine-readable code identifying the issue type. */
  code: string;

  /** Human-readable description of the issue. */
  message: string;

  /** Severity of the issue. Only "error" severity blocks the workflow. */
  severity: ValidationIssueSeverity;

  /** Optional additional context about the issue. */
  details?: Record<string, unknown>;
};

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

  /** Number of error-severity issues (these block the workflow). */
  errors: number;

  /** Number of warning-severity issues (allow proceeding with confirmation). */
  warnings: number;
};

/** The complete validation result returned by the validation endpoint. */
export type ValidationResult = {
  /**
   * Whether the workflow can proceed without any confirmation.
   * False if there are any error or warning severity issues.
   */
  valid: boolean;

  /** The full validation tree mirroring the step structure. */
  result: StepValidationResult;

  /** Flat summary of issue counts for quick frontend decisions. */
  summary: ValidationSummary;
};

/** Builds the validation result of a step tree, with issue counts across every step in it. */
export function toValidationResult(
  result: StepValidationResult,
): ValidationResult {
  const summary = aggregateSummary(result);
  return {
    result,
    summary,
    valid: summary.errors === 0 && summary.warnings === 0,
  };
}

/** Recursively aggregates issue counts across the full validation tree. */
function aggregateSummary(result: StepValidationResult): ValidationSummary {
  let errors = 0;
  let warnings = 0;

  for (const issue of result.issues) {
    if (issue.severity === "error") {
      errors += 1;
    } else if (issue.severity === "warning") {
      warnings += 1;
    }
  }

  for (const child of result.children) {
    const childSummary = aggregateSummary(child);
    errors += childSummary.errors;
    warnings += childSummary.warnings;
  }

  return {
    errors,
    totalIssues: errors + warnings,
    warnings,
  };
}
