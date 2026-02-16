# `RunInstallationOptions`

```ts
type RunInstallationOptions = {
  config: CommerceAppConfigOutputModel;
  hooks?: InstallationHooks;
  initialState: InProgressInstallationState;
  installationContext: InstallationContext;
};
```

Defined in: [management/installation/runner.ts:32](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L32)

Options for running an installation.

## Properties

### config

```ts
config: CommerceAppConfigOutputModel;
```

Defined in: [management/installation/runner.ts:37](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L37)

The app configuration.

---

### hooks?

```ts
optional hooks: InstallationHooks;
```

Defined in: [management/installation/runner.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L43)

Lifecycle hooks for status change notifications.

---

### initialState

```ts
initialState: InProgressInstallationState;
```

Defined in: [management/installation/runner.ts:40](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L40)

The initial installation state (with all steps pending).

---

### installationContext

```ts
installationContext: InstallationContext;
```

Defined in: [management/installation/runner.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L34)

Shared installation context (params, logger, etc.).
