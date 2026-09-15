# `CreateInitialUninstallationStateOptions`

```ts
type CreateInitialUninstallationStateOptions = {
  config: CommerceAppConfigOutputModel;
  executedCustomInstallationSteps?: readonly CustomInstallationStepIdentity[];
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:173](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L173)

Options for creating an initial uninstallation state.

## Properties

### config

```ts
config: CommerceAppConfigOutputModel;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:175](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L175)

The app configuration used to determine applicable steps.

---

### executedCustomInstallationSteps?

```ts
optional executedCustomInstallationSteps?: readonly CustomInstallationStepIdentity[];
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:182](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L182)

Persisted history of every custom installation step that ever ran, from the lifecycle
baseline snapshot. Lets a full unassociate reach steps removed from `config` in a previous
upgrade. Defaults to `[]` when there is no recorded history (e.g. legacy installs).
