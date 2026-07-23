# `ValidationContext`

```ts
type ValidationContext = Omit<InstallationContext, "customScripts">;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:75](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L75)

A narrowed context available to step `validate` handlers.
Excludes `customScripts` — those only apply during installation, not pre-flight validation.
