# `InstallationContext`

```ts
type InstallationContext = {
  appData: AppData;
  customScripts?: Record<string, unknown>;
  logger: ReturnType<typeof AioLogger>;
  params: RuntimeActionParams & {
    AIO_COMMERCE_AUTH_IMS_CLIENT_ID: string;
    AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: string | string[];
    AIO_COMMERCE_AUTH_IMS_ORG_ID: string;
    AIO_COMMERCE_AUTH_IMS_SCOPES: string | string[];
    AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: string;
    AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: string;
  };
};
```

Defined in: [management/installation/workflow/step.ts:19](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L19)

Shared context available to all steps during installation.

## Properties

### appData

```ts
appData: AppData;
```

Defined in: [management/installation/workflow/step.ts:21](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L21)

The credentials of the app being installed

---

### customScripts?

```ts
optional customScripts: Record<string, unknown>;
```

Defined in: [management/installation/workflow/step.ts:37](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L37)

Custom scripts defined in the configuration (if any).

---

### logger

```ts
logger: ReturnType<typeof AioLogger>;
```

Defined in: [management/installation/workflow/step.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L34)

Logger instance for installation logging.

---

### params

```ts
params: RuntimeActionParams & {
  AIO_COMMERCE_AUTH_IMS_CLIENT_ID: string;
  AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: string | string[];
  AIO_COMMERCE_AUTH_IMS_ORG_ID: string;
  AIO_COMMERCE_AUTH_IMS_SCOPES: string | string[];
  AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: string;
  AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: string;
};
```

Defined in: [management/installation/workflow/step.ts:24](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L24)

The raw action parameters from the App Builder runtime action.

#### Type Declaration

##### AIO_COMMERCE_AUTH_IMS_CLIENT_ID

```ts
AIO_COMMERCE_AUTH_IMS_CLIENT_ID: string;
```

##### AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS

```ts
AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: string | string[];
```

##### AIO_COMMERCE_AUTH_IMS_ORG_ID

```ts
AIO_COMMERCE_AUTH_IMS_ORG_ID: string;
```

##### AIO_COMMERCE_AUTH_IMS_SCOPES

```ts
AIO_COMMERCE_AUTH_IMS_SCOPES: string | string[];
```

##### AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL

```ts
AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: string;
```

##### AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID

```ts
AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: string;
```
