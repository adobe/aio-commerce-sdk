# `StepFailedEvent`

```ts
type StepFailedEvent = StepEvent & {
  error: WorkflowError;
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/hooks.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/hooks.ts#L46)

Event payload when a step fails.

## Type Declaration

### error

```ts
error: WorkflowError;
```

Error information.
