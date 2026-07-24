# `getConfigDomains()`

```ts
function getConfigDomains(
  config: AnyCommerceAppConfig,
): Set<
  | "metadata"
  | "adminUi"
  | "businessConfig"
  | "eventing"
  | "installation"
  | "webhooks"
  | "businessConfig.schema"
  | "eventing.commerce"
  | "eventing.external"
  | "installation.customInstallationSteps"
>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/domains.ts:60](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/config/schema/domains.ts#L60)

Get the config domains that are present in the config.

## Parameters

| Parameter | Type                   | Description                 |
| --------- | ---------------------- | --------------------------- |
| `config`  | `AnyCommerceAppConfig` | The configuration to check. |

## Returns

`Set`\<
\| `"metadata"`
\| `"adminUi"`
\| `"businessConfig"`
\| `"eventing"`
\| `"installation"`
\| `"webhooks"`
\| `"businessConfig.schema"`
\| `"eventing.commerce"`
\| `"eventing.external"`
\| `"installation.customInstallationSteps"`\>
