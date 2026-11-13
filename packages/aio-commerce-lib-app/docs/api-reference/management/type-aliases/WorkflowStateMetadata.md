# `WorkflowStateMetadata`

```ts
type WorkflowStateMetadata = {
  isRetry: boolean;
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:97](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L97)

Per-run state metadata captured alongside a workflow run's outcome.

## Properties

### isRetry

```ts
isRetry: boolean;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:99](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L99)

True when the workflow was attempted more than once.
