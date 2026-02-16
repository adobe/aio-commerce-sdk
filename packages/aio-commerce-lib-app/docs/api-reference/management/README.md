# `management`: Module

## Interfaces

| Interface                        | Description                                           |
| -------------------------------- | ----------------------------------------------------- |
| [AnyStep](interfaces/AnyStep.md) | Loosely-typed step for use in non type-safe contexts. |

## Type Aliases

| Type Alias                                                                                     | Description                                                                                                      |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [BranchStep](type-aliases/BranchStep.md)                                                       | A branch step that contains children (no execution).                                                             |
| [BranchStepOptions](type-aliases/BranchStepOptions.md)                                         | Options for defining a branch step.                                                                              |
| [CreateInitialInstallationStateOptions](type-aliases/CreateInitialInstallationStateOptions.md) | Options for creating an initial installation state.                                                              |
| [CreateInitialStateOptions](type-aliases/CreateInitialStateOptions.md)                         | Options for creating an initial installation state.                                                              |
| [CustomInstallationStepHandler](type-aliases/CustomInstallationStepHandler.md)                 | Handler function type for custom installation steps.                                                             |
| [ExecuteWorkflowOptions](type-aliases/ExecuteWorkflowOptions.md)                               | Options for executing a workflow.                                                                                |
| [ExecutionContext](type-aliases/ExecutionContext.md)                                           | The execution context passed to leaf step run handlers.                                                          |
| [ExecutionStatus](type-aliases/ExecutionStatus.md)                                             | Status of a step execution.                                                                                      |
| [FailedInstallationState](type-aliases/FailedInstallationState.md)                             | Installation state when failed.                                                                                  |
| [InferStepOutput](type-aliases/InferStepOutput.md)                                             | Infer the output type from a leaf step.                                                                          |
| [InProgressInstallationState](type-aliases/InProgressInstallationState.md)                     | Installation state when in progress.                                                                             |
| [InstallationContext](type-aliases/InstallationContext.md)                                     | Shared context available to all steps during installation.                                                       |
| [InstallationData](type-aliases/InstallationData.md)                                           | Data collected during installation as a nested structure following step paths.                                   |
| [InstallationError](type-aliases/InstallationError.md)                                         | A structured error with path to the failing step.                                                                |
| [InstallationHooks](type-aliases/InstallationHooks.md)                                         | Lifecycle hooks for installation execution.                                                                      |
| [InstallationState](type-aliases/InstallationState.md)                                         | The full installation state (persisted and returned by status endpoints). Discriminated union by `status` field. |
| [InstallationStatus](type-aliases/InstallationStatus.md)                                       | Overall installation status.                                                                                     |
| [LeafStep](type-aliases/LeafStep.md)                                                           | A leaf step that executes work (no children).                                                                    |
| [LeafStepOptions](type-aliases/LeafStepOptions.md)                                             | Options for defining a leaf step.                                                                                |
| [RunInstallationOptions](type-aliases/RunInstallationOptions.md)                               | Options for running an installation.                                                                             |
| [Step](type-aliases/Step.md)                                                                   | A step in the installation tree (discriminated union by `type`).                                                 |
| [StepContextFactory](type-aliases/StepContextFactory.md)                                       | Factory function type for creating step-specific context.                                                        |
| [StepEvent](type-aliases/StepEvent.md)                                                         | Base event payload for step events.                                                                              |
| [StepFailedEvent](type-aliases/StepFailedEvent.md)                                             | Event payload when a step fails.                                                                                 |
| [StepMeta](type-aliases/StepMeta.md)                                                           | Metadata for a step (used for UI display).                                                                       |
| [StepStartedEvent](type-aliases/StepStartedEvent.md)                                           | Event payload when a step starts execution.                                                                      |
| [StepStatus](type-aliases/StepStatus.md)                                                       | Status of a step in the installation tree.                                                                       |
| [StepSucceededEvent](type-aliases/StepSucceededEvent.md)                                       | Event payload when a step succeeds.                                                                              |
| [SucceededInstallationState](type-aliases/SucceededInstallationState.md)                       | Installation state when completed successfully.                                                                  |

## Functions

| Function                                                                      | Description                                                                                                                                                                             |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [createInitialInstallationState](functions/createInitialInstallationState.md) | Creates an initial installation state from the config and step definitions. Filters steps based on their `when` conditions and builds a tree structure with all steps set to "pending". |
| [createInitialState](functions/createInitialState.md)                         | biome-ignore-all lint/performance/noBarrelFile: Convenience entrypoint for the workflow module                                                                                          |
| [defineBranchStep](functions/defineBranchStep.md)                             | Define a branch step (container with children, no runner).                                                                                                                              |
| [defineCustomInstallationStep](functions/defineCustomInstallationStep.md)     | Define a custom installation step with type-safe parameters.                                                                                                                            |
| [defineLeafStep](functions/defineLeafStep.md)                                 | Define a leaf step (executable, no children).                                                                                                                                           |
| [executeWorkflow](functions/executeWorkflow.md)                               | biome-ignore-all lint/performance/noBarrelFile: Convenience entrypoint for the workflow module                                                                                          |
| [isBranchStep](functions/isBranchStep.md)                                     | Check if a step is a branch step.                                                                                                                                                       |
| [isCompletedState](functions/isCompletedState.md)                             | Type guard for completed installation state (succeeded or failed).                                                                                                                      |
| [isFailedState](functions/isFailedState.md)                                   | Type guard for failed installation state.                                                                                                                                               |
| [isInProgressState](functions/isInProgressState.md)                           | Type guard for in-progress installation state.                                                                                                                                          |
| [isLeafStep](functions/isLeafStep.md)                                         | Check if a step is a leaf step.                                                                                                                                                         |
| [isSucceededState](functions/isSucceededState.md)                             | Type guard for succeeded installation state.                                                                                                                                            |
| [runInstallation](functions/runInstallation.md)                               | Runs the full installation workflow. Returns the final state (never throws).                                                                                                            |
