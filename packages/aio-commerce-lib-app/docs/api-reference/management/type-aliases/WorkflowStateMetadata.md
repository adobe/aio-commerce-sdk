# `WorkflowStateMetadata`

```ts
type WorkflowStateMetadata = {
  isRetry: boolean;
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:91](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L91)

Per-run state metadata captured alongside a workflow run's outcome.

## Properties

### isRetry

```ts
isRetry: boolean;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:93](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L93)

True when the workflow was attempted more than once.
