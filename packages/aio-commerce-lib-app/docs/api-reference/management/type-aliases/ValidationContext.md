# `ValidationContext`

```ts
type ValidationContext = Omit<InstallationContext, "customScripts">;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:75](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L75)

A narrowed context available to step `validate` handlers.
Excludes `customScripts` — those only apply during installation, not pre-flight validation.
