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

Defined in: [aio-commerce-lib-app/source/config/schema/domains.ts:60](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/config/schema/domains.ts#L60)

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
