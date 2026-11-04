# ~~`RunInstallationOptions`~~

```ts
type RunInstallationOptions = {
  config: CommerceAppConfigOutputModel;
  hooks?: InstallationHooks;
  initialState: InProgressWorkflowState;
  installationContext: LifecycleContext;
};
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:95](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L95)

Options for running an installation.

## Deprecated

Removed in the next major together with [runInstallation](../functions/runInstallation.md).

## Properties

### ~~config~~

```ts
config: CommerceAppConfigOutputModel;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:100](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L100)

The app configuration.

---

### ~~hooks?~~

```ts
hooks?: InstallationHooks;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:106](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L106)

Lifecycle hooks for status change notifications.

---

### ~~initialState~~

```ts
initialState: InProgressWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:103](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L103)

The initial installation state (with all steps pending).

---

### ~~installationContext~~

```ts
installationContext: LifecycleContext;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:97](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L97)

Shared installation context (params, logger, etc.).
