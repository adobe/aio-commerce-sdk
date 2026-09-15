# `RunUninstallationOptions`

```ts
type RunUninstallationOptions = {
  config: CommerceAppConfigOutputModel;
  executedCustomInstallationSteps?: readonly CustomInstallationStepIdentity[];
  hooks?: InstallationHooks;
  initialState: InProgressWorkflowState;
  installationContext: LifecycleContext;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:186](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L186)

Options for running an uninstallation.

## Properties

### config

```ts
config: CommerceAppConfigOutputModel;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:190](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L190)

The app configuration.

---

### executedCustomInstallationSteps?

```ts
optional executedCustomInstallationSteps?: readonly CustomInstallationStepIdentity[];
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:197](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L197)

Same as [CreateInitialUninstallationStateOptions.executedCustomInstallationSteps](CreateInitialUninstallationStateOptions.md#executedcustominstallationsteps).

---

### hooks?

```ts
optional hooks?: InstallationHooks;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:194](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L194)

Lifecycle hooks for status change notifications.

---

### initialState

```ts
initialState: InProgressWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:192](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L192)

The initial uninstallation state (with all steps pending).

---

### installationContext

```ts
installationContext: LifecycleContext;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:188](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L188)

Shared installation context (params, logger, etc.).
