# `WorkflowStateMetadata`

```ts
type WorkflowStateMetadata = {
  isRetry: boolean;
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:97](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L97)

Per-run state metadata captured alongside a workflow run's outcome.

## Properties

### isRetry

```ts
isRetry: boolean;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:99](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L99)

True when the workflow was attempted more than once.
