# `ValidationContext`

```ts
type ValidationContext = Omit<LifecycleContext, "customScripts">;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:72](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L72)

A narrowed context available to step `validate` handlers.
Excludes `customScripts` — those only apply during execution, not pre-flight validation.
