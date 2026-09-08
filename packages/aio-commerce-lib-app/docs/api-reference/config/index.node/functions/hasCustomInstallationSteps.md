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

Defined in: [aio-commerce-lib-app/source/config/schema/installation.ts:146](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-app/source/config/schema/installation.ts#L146)

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
