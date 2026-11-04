# `InProgressWorkflowState`

```ts
type InProgressWorkflowState = WorkflowRunStateBase & {
  startedAt: string;
  status: "in-progress";
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:89](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L89)

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
