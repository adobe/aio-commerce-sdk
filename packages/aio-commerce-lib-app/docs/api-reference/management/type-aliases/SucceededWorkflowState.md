# `SucceededWorkflowState`

```ts
type SucceededWorkflowState = WorkflowRunStateBase & {
  completedAt: string;
  metadata?: WorkflowStateMetadata;
  startedAt: string;
  status: "succeeded";
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:97](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L97)

Workflow run state when completed successfully.

## Type Declaration

### completedAt

```ts
completedAt: string;
```

ISO timestamp when the workflow completed.

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
status: "succeeded";
```
