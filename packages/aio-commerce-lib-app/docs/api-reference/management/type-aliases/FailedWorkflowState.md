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

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:111](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L111)

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
optional metadata?: WorkflowStateMetadata;
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
