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

Defined in: [aio-commerce-lib-app/source/config/schema/installation.ts:143](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/config/schema/installation.ts#L143)

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
