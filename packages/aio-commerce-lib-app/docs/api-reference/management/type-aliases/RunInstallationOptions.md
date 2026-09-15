# `RunInstallationOptions`

```ts
type RunInstallationOptions = {
  config: CommerceAppConfigOutputModel;
  hooks?: InstallationHooks;
  initialState: InProgressWorkflowState;
  installationContext: LifecycleContext;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:85](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L85)

Options for running an installation.

## Properties

### config

```ts
config: CommerceAppConfigOutputModel;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:90](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L90)

The app configuration.

---

### hooks?

```ts
optional hooks?: InstallationHooks;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:96](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L96)

Lifecycle hooks for status change notifications.

---

### initialState

```ts
initialState: InProgressWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:93](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L93)

The initial installation state (with all steps pending).

---

### installationContext

```ts
installationContext: LifecycleContext;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:87](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L87)

Shared installation context (params, logger, etc.).
