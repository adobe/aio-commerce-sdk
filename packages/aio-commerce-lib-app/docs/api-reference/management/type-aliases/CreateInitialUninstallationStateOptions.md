# ~~`CreateInitialUninstallationStateOptions`~~

```ts
type CreateInitialUninstallationStateOptions = {
  config: CommerceAppConfigOutputModel;
  executedCustomInstallationSteps?: readonly CustomInstallationStepIdentity[];
};
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:195](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L195)

Options for creating an initial uninstallation state.

## Deprecated

Removed in the next major together with [createInitialUninstallationState](../functions/createInitialUninstallationState.md).

## Properties

### ~~config~~

```ts
config: CommerceAppConfigOutputModel;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:197](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L197)

The app configuration used to determine applicable steps.

---

### ~~executedCustomInstallationSteps?~~

```ts
executedCustomInstallationSteps?: readonly CustomInstallationStepIdentity[];
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:204](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L204)

Persisted history of every custom installation step that ever ran, from the lifecycle
baseline snapshot. Lets a full unassociate reach steps removed from `config` in a previous
upgrade. Defaults to `[]` when there is no recorded history (e.g. legacy installs).
