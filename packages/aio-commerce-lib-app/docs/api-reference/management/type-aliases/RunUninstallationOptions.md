# `RunUninstallationOptions`

```ts
type RunUninstallationOptions = {
  config: CommerceAppConfigOutputModel;
  hooks?: InstallationHooks;
  initialState: InProgressInstallationState;
  installationContext: InstallationContext;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:135](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L135)

Options for running an uninstallation.

## Properties

### config

```ts
config: CommerceAppConfigOutputModel;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:139](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L139)

The app configuration.

---

### hooks?

```ts
optional hooks?: InstallationHooks;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:143](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L143)

Lifecycle hooks for status change notifications.

---

### initialState

```ts
initialState: InProgressInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:141](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L141)

The initial uninstallation state (with all steps pending).

---

### installationContext

```ts
installationContext: InstallationContext;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:137](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L137)

Shared installation context (params, logger, etc.).
