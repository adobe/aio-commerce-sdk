# `hasConfigDomain()`

```ts
function hasConfigDomain(
  config: AnyCommerceAppConfig,
  domain:
    | "metadata"
    | "adminUi"
    | "businessConfig"
    | "eventing"
    | "installation"
    | "webhooks"
    | "businessConfig.schema"
    | "eventing.commerce"
    | "eventing.external"
    | "installation.customInstallationSteps",
): boolean;
```

Defined in: [aio-commerce-lib-app/source/config/schema/domains.ts:92](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/config/schema/domains.ts#L92)

Check if the config has a specific domain.

## Parameters

| Parameter | Type                                                                                                                                                                                                                                | Description                 |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `config`  | `AnyCommerceAppConfig`                                                                                                                                                                                                              | The configuration to check. |
| `domain`  | \| `"metadata"` \| `"adminUi"` \| `"businessConfig"` \| `"eventing"` \| `"installation"` \| `"webhooks"` \| `"businessConfig.schema"` \| `"eventing.commerce"` \| `"eventing.external"` \| `"installation.customInstallationSteps"` | The domain to check.        |

## Returns

`boolean`
