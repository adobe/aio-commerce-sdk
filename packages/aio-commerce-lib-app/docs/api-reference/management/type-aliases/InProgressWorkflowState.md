# `InProgressWorkflowState`

```ts
type InProgressWorkflowState = WorkflowRunStateBase & {
  startedAt: string;
  status: "in-progress";
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:89](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L89)

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
