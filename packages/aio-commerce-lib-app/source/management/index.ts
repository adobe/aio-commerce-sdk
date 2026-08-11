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

/** biome-ignore-all lint/performance/noBarrelFile: This is the public API for the management entrypoint */

/**
 * This module exports shared application management utilities for the AIO Commerce SDK.
 * @packageDocumentation
 */

export {
  isCompletedState,
  isFailedState,
  isInProgressState,
  isSucceededState,
} from "./common/workflow";
export { defineCustomInstallationStep } from "./domains/custom-installation";
// Eventing upgrade reconcile (add / remove / registration update).
export { reconcileEventing } from "./domains/events/index";
// Export installation-specific functions
export {
  createInitialInstallationState,
  createInitialUninstallationState,
  runInstallation,
  runUninstallation,
  runValidation,
} from "./installation/runner";
// Generic, domain-agnostic upgrade config diff engine + orchestrator.
export {
  configHasDestructiveChange,
  configHasUnsupportedChange,
  diffConfig,
  executeUpgrade,
  getChangesForDomain,
  getOperativeChanges,
  isEmptyPlan,
  planUpgrade,
  UnsupportedUpgradeError,
} from "./upgrade/index";
// App-upgrade registry + entry points (drives every built-in domain).
export {
  appUpgradeDomains,
  previewUpgrade,
  runUpgrade,
} from "./upgrade-domains";

export type * from "./common/workflow";
export type {
  CustomInstallationStepDefinition,
  CustomInstallationStepHandler,
} from "./domains/custom-installation";
export type {
  EventingReconcileResult,
  ReconcileEventingOptions,
} from "./domains/events/index";
// Deprecated back-compat aliases for the renamed workflow engine types.
export type * from "./installation/compat";
export type {
  CreateInitialInstallationStateOptions,
  CreateInitialUninstallationStateOptions,
  InstallationHooks,
  RunInstallationOptions,
  RunUninstallationOptions,
  RunValidationOptions,
} from "./installation/runner";
export type {
  ConfigDiff,
  DomainCollector,
  DomainRule,
  ExecuteUpgradeOptions,
  ResourceChange,
  ResourceKind,
  UpgradeBaseline,
  UpgradeDomain,
  UpgradeResult,
  UpgradeStatus,
} from "./upgrade/index";
export type { RunUpgradeOptions } from "./upgrade-domains";
