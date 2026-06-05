# `hasCustomInstallationSteps()`

```ts
function hasCustomInstallationSteps<T>(config: T): config is T & {
  installation: NonNullable<T["installation"]>;
} & {
  installation: InstallationConfig<T>["installation"] & {
    customInstallationSteps: NonNullable<
      InstallationConfig<T>["installation"]["customInstallationSteps"]
    >;
  };
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/installation.ts:149](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-app/source/config/schema/installation.ts#L149)

Check if config has custom installation steps.

## Type Parameters

| Type Parameter                       |
| ------------------------------------ |
| `T` _extends_ `AnyCommerceAppConfig` |

## Parameters

| Parameter | Type | Description                 |
| --------- | ---- | --------------------------- |
| `config`  | `T`  | The configuration to check. |

## Returns

`config is T & { installation: NonNullable<T["installation"]> } & { installation: InstallationConfig<T>["installation"] & { customInstallationSteps: NonNullable<InstallationConfig<T>["installation"]["customInstallationSteps"]> } }`
