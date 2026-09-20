# `ValidationContext`

```ts
type ValidationContext = Omit<LifecycleContext, "customScripts">;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:77](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L77)

A narrowed context available to step `validate` handlers.
Excludes `customScripts` — those only apply during execution, not pre-flight validation.
