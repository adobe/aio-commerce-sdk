# `FailedWorkflowState`

```ts
type FailedWorkflowState = WorkflowRunStateBase & {
  completedAt: string;
  error: WorkflowError;
  metadata?: WorkflowStateMetadata;
  startedAt: string;
  status: "failed";
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:117](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L117)

Workflow run state when failed.

## Type Declaration

### completedAt

```ts
completedAt: string;
```

ISO timestamp when the workflow failed.

### error

```ts
error: WorkflowError;
```

Error information about the failure.

### metadata?

```ts
metadata?: WorkflowStateMetadata;
```

Per-run state metadata, present when a retry was attempted.

### startedAt

```ts
startedAt: string;
```

ISO timestamp when the workflow started.

### status

```ts
status: "failed";
```
