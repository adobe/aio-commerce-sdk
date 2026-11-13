# `SucceededWorkflowState`

```ts
type SucceededWorkflowState = WorkflowRunStateBase & {
  completedAt: string;
  metadata?: WorkflowStateMetadata;
  startedAt: string;
  status: "succeeded";
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:103](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L103)

Workflow run state when completed successfully.

## Type Declaration

### completedAt

```ts
completedAt: string;
```

ISO timestamp when the workflow completed.

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
status: "succeeded";
```
