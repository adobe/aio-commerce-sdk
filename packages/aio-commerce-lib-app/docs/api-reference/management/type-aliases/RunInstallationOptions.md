# `RunInstallationOptions`

```ts
type RunInstallationOptions = {
  config: CommerceAppConfigOutputModel;
  hooks?: InstallationHooks;
  initialState: InProgressInstallationState;
  installationContext: InstallationContext;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:44](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L44)

Options for running an installation.

## Properties

### config

```ts
config: CommerceAppConfigOutputModel;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:49](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L49)

The app configuration.

---

### hooks?

```ts
optional hooks?: InstallationHooks;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:55](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L55)

Lifecycle hooks for status change notifications.

---

### initialState

```ts
initialState: InProgressInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:52](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L52)

The initial installation state (with all steps pending).

---

### installationContext

```ts
installationContext: InstallationContext;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L46)

Shared installation context (params, logger, etc.).
