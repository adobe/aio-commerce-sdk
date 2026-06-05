# `getConfigDomains()`

```ts
function getConfigDomains(
  config: AnyCommerceAppConfig,
): Set<
  | "metadata"
  | "businessConfig"
  | "eventing"
  | "adminUiSdk"
  | "installation"
  | "webhooks"
  | "businessConfig.schema"
  | "eventing.commerce"
  | "eventing.external"
  | "installation.customInstallationSteps"
>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/domains.ts:60](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-app/source/config/schema/domains.ts#L60)

Get the config domains that are present in the config.

## Parameters

| Parameter | Type                   | Description                 |
| --------- | ---------------------- | --------------------------- |
| `config`  | `AnyCommerceAppConfig` | The configuration to check. |

## Returns

`Set`\<
\| `"metadata"`
\| `"businessConfig"`
\| `"eventing"`
\| `"adminUiSdk"`
\| `"installation"`
\| `"webhooks"`
\| `"businessConfig.schema"`
\| `"eventing.commerce"`
\| `"eventing.external"`
\| `"installation.customInstallationSteps"`\>
