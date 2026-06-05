# `hasConfigDomain()`

```ts
function hasConfigDomain(
  config: AnyCommerceAppConfig,
  domain:
    | "metadata"
    | "businessConfig"
    | "eventing"
    | "adminUiSdk"
    | "installation"
    | "webhooks"
    | "businessConfig.schema"
    | "eventing.commerce"
    | "eventing.external"
    | "installation.customInstallationSteps",
): boolean;
```

Defined in: [aio-commerce-lib-app/source/config/schema/domains.ts:92](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-app/source/config/schema/domains.ts#L92)

Check if the config has a specific domain.

## Parameters

| Parameter | Type                                                                                                                                                                                                                                   | Description                 |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `config`  | `AnyCommerceAppConfig`                                                                                                                                                                                                                 | The configuration to check. |
| `domain`  | \| `"metadata"` \| `"businessConfig"` \| `"eventing"` \| `"adminUiSdk"` \| `"installation"` \| `"webhooks"` \| `"businessConfig.schema"` \| `"eventing.commerce"` \| `"eventing.external"` \| `"installation.customInstallationSteps"` | The domain to check.        |

## Returns

`boolean`
