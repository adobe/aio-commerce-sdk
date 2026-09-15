# `InProgressWorkflowState`

```ts
type InProgressWorkflowState = WorkflowRunStateBase & {
  startedAt: string;
  status: "in-progress";
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:83](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L83)

Workflow run state when in progress.

## Type Declaration

### startedAt

```ts
startedAt: string;
```

ISO timestamp when the workflow started.

### status

```ts
status: "in-progress";
```
