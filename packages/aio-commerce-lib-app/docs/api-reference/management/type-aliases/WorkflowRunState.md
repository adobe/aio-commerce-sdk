# `WorkflowRunState`

```ts
type WorkflowRunState =
  InProgressWorkflowState | SucceededWorkflowState | FailedWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:137](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L137)

The full workflow run state (persisted and returned by status endpoints).
Discriminated union by `status` field.
