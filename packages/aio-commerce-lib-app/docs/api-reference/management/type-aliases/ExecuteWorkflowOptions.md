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

Defined in: [management/installation/workflow/runner.ts:50](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L50)

Options for executing a workflow.

## Properties

### config

```ts
config: CommerceAppConfigOutputModel;
```

Defined in: [management/installation/workflow/runner.ts:58](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L58)

The app configuration.

---

### hooks?

```ts
optional hooks: InstallationHooks;
```

Defined in: [management/installation/workflow/runner.ts:64](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L64)

Lifecycle hooks for status change notifications.

---

### initialState

```ts
initialState: InProgressInstallationState;
```

Defined in: [management/installation/workflow/runner.ts:61](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L61)

The initial installation state (with all steps pending).

---

### installationContext

```ts
installationContext: InstallationContext;
```

Defined in: [management/installation/workflow/runner.ts:55](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L55)

Shared installation context (params, logger, etc.).

---

### rootStep

```ts
rootStep: BranchStep;
```

Defined in: [management/installation/workflow/runner.ts:52](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L52)

The root branch step to execute.
