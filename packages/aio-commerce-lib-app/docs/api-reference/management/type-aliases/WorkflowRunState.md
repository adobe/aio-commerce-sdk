# `WorkflowRunState`

```ts
type WorkflowRunState =
  InProgressWorkflowState | SucceededWorkflowState | FailedWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:131](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L131)

The full workflow run state (persisted and returned by status endpoints).
Discriminated union by `status` field.
