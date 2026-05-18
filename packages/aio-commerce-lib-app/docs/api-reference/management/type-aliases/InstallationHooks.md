# `InstallationHooks`

```ts
type InstallationHooks = {
  onInstallationFailure?: InstallationHook;
  onInstallationStart?: InstallationHook;
  onInstallationSuccess?: InstallationHook;
  onStepFailure?: HookFunction<StepFailedEvent>;
  onStepStart?: HookFunction<StepStartedEvent>;
  onStepSuccess?: HookFunction<StepSucceededEvent>;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/hooks.ts:52](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/workflow/hooks.ts#L52)

Lifecycle hooks for installation execution.

## Properties

### onInstallationFailure?

```ts
optional onInstallationFailure?: InstallationHook;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/hooks.ts:55](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/workflow/hooks.ts#L55)

---

### onInstallationStart?

```ts
optional onInstallationStart?: InstallationHook;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/hooks.ts:53](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/workflow/hooks.ts#L53)

---

### onInstallationSuccess?

```ts
optional onInstallationSuccess?: InstallationHook;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/hooks.ts:54](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/workflow/hooks.ts#L54)

---

### onStepFailure?

```ts
optional onStepFailure?: HookFunction<StepFailedEvent>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/hooks.ts:59](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/workflow/hooks.ts#L59)

---

### onStepStart?

```ts
optional onStepStart?: HookFunction<StepStartedEvent>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/hooks.ts:57](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/workflow/hooks.ts#L57)

---

### onStepSuccess?

```ts
optional onStepSuccess?: HookFunction<StepSucceededEvent>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/hooks.ts:58](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/workflow/hooks.ts#L58)
