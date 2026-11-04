# `hasCustomInstallationSteps()`

```ts
function hasCustomInstallationSteps<T extends AnyCommerceAppConfig>(
  config: T,
): config is T & { installation: NonNullable<T["installation"]> } & {
  installation: InstallationConfig<T>["installation"] & {
    customInstallationSteps: NonNullable<
      InstallationConfig<T>["installation"]["customInstallationSteps"]
    >;
  };
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/installation.ts:143](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/config/schema/installation.ts#L143)

Check if config has custom installation steps.

## Type Parameters

| Type Parameter                                                     |
| ------------------------------------------------------------------ |
| <a id="type-parameter-t"></a> `T` _extends_ `AnyCommerceAppConfig` |

## Parameters

| Parameter | Type | Description                 |
| --------- | ---- | --------------------------- |
| `config`  | `T`  | The configuration to check. |

## Returns

`config is T & { installation: NonNullable<T["installation"]> } & { installation: InstallationConfig<T>["installation"] & { customInstallationSteps: NonNullable<InstallationConfig<T>["installation"]["customInstallationSteps"]> } }`
