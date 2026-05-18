---
title: "ValidationContext"
editUrl: false
prev: false
next: false
---

```ts
type ValidationContext = Omit<InstallationContext, "customScripts">;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:75](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L75)

A narrowed context available to step `validate` handlers.
Excludes `customScripts` — those only apply during installation, not pre-flight validation.
