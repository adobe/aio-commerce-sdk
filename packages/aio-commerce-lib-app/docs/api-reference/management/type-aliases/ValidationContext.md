# `ValidationContext`

```ts
type ValidationContext = Omit<LifecycleContext, "customScripts">;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:72](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L72)

A narrowed context available to step `validate` handlers.
Excludes `customScripts` — those only apply during execution, not pre-flight validation.
