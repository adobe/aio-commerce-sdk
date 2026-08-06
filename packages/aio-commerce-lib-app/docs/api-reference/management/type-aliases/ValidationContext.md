# `ValidationContext`

```ts
type ValidationContext = Omit<InstallationContext, "customScripts">;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:75](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L75)

A narrowed context available to step `validate` handlers.
Excludes `customScripts` — those only apply during installation, not pre-flight validation.
