# ~~`RunUninstallationOptions`~~

```ts
type RunUninstallationOptions = {
  config: CommerceAppConfigOutputModel;
  executedCustomInstallationSteps?: readonly CustomInstallationStepIdentity[];
  hooks?: InstallationHooks;
  initialState: InProgressWorkflowState;
  installationContext: LifecycleContext;
};
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:212](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L212)

Options for running an uninstallation.

## Deprecated

Removed in the next major together with [runUninstallation](../functions/runUninstallation.md).

## Properties

### ~~config~~

```ts
config: CommerceAppConfigOutputModel;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:216](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L216)

The app configuration.

---

### ~~executedCustomInstallationSteps?~~

```ts
executedCustomInstallationSteps?: readonly CustomInstallationStepIdentity[];
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:223](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L223)

Same as [CreateInitialUninstallationStateOptions.executedCustomInstallationSteps](CreateInitialUninstallationStateOptions.md#executedcustominstallationsteps).

---

### ~~hooks?~~

```ts
hooks?: InstallationHooks;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:220](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L220)

Lifecycle hooks for status change notifications.

---

### ~~initialState~~

```ts
initialState: InProgressWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:218](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L218)

The initial uninstallation state (with all steps pending).

---

### ~~installationContext~~

```ts
installationContext: LifecycleContext;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:214](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L214)

Shared installation context (params, logger, etc.).
