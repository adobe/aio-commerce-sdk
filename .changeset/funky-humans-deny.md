---
"@adobe/aio-commerce-lib-app": minor
---

Generalize the workflow engine to lifecycle-neutral names (`LifecycleContext`, `WorkflowData`, `WorkflowError`, `WorkflowRunState` and its variants, `WorkflowStateMetadata`, `WorkflowHooks`) so it can be reused across lifecycle modules. The previous installation-branded type names remain exported as `@deprecated` aliases.
