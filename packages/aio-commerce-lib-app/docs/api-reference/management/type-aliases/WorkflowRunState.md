# `WorkflowRunState`

```ts
type WorkflowRunState =
  InProgressWorkflowState | SucceededWorkflowState | FailedWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:137](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L137)

The full workflow run state (persisted and returned by status endpoints).
Discriminated union by `status` field.
