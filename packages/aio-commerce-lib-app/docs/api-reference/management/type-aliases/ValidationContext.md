# `ValidationContext`

```ts
type ValidationContext = Omit<InstallationContext, "customScripts">;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:75](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L75)

A narrowed context available to step `validate` handlers.
Excludes `customScripts` — those only apply during installation, not pre-flight validation.
