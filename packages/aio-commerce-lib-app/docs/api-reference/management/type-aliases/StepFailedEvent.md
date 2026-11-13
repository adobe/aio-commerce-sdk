# `StepFailedEvent`

```ts
type StepFailedEvent = StepEvent & {
  error: WorkflowError;
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/hooks.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/hooks.ts#L46)

Event payload when a step fails.

## Type Declaration

### error

```ts
error: WorkflowError;
```

Error information.
