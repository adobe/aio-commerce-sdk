# `ExecuteWorkflowOptions`

```ts
type ExecuteWorkflowOptions = {
  config: CommerceAppConfigOutputModel;
  hooks?: InstallationHooks;
  initialState: InProgressInstallationState;
  installationContext: InstallationContext;
  rootStep: BranchStep;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/runner.ts:53](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L53)

Options for executing a workflow.

## Properties

### config

```ts
config: CommerceAppConfigOutputModel;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/runner.ts:61](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L61)

The app configuration.

---

### hooks?

```ts
optional hooks?: InstallationHooks;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/runner.ts:67](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L67)

Lifecycle hooks for status change notifications.

---

### initialState

```ts
initialState: InProgressInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/runner.ts:64](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L64)

The initial installation state (with all steps pending).

---

### installationContext

```ts
installationContext: InstallationContext;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/runner.ts:58](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L58)

Shared installation context (params, logger, etc.).

---

### rootStep

```ts
rootStep: BranchStep;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/runner.ts:55](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L55)

The root branch step to execute.
