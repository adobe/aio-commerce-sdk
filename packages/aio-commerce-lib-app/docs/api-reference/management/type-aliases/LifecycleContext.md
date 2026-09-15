# `LifecycleContext`

```ts
type LifecycleContext = {
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

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:42](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L42)

Shared context available to all steps during a lifecycle workflow.

## Properties

### appData

```ts
appData: AppData;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:44](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L44)

The credentials of the app being managed.

---

### customScripts?

```ts
optional customScripts?: Record<string, unknown>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:60](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L60)

Custom scripts defined in the configuration (if any).

---

### logger

```ts
logger: ReturnType<typeof AioLogger>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:57](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L57)

Logger instance for workflow logging.

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

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L47)

The raw action parameters from the App Builder runtime action.

#### Type Declaration

##### AIO\_COMMERCE\_AUTH\_IMS\_CLIENT\_ID

```ts
AIO_COMMERCE_AUTH_IMS_CLIENT_ID: string;
```

##### AIO\_COMMERCE\_AUTH\_IMS\_CLIENT\_SECRETS

```ts
AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: string | string[];
```

##### AIO\_COMMERCE\_AUTH\_IMS\_ORG\_ID

```ts
AIO_COMMERCE_AUTH_IMS_ORG_ID: string;
```

##### AIO\_COMMERCE\_AUTH\_IMS\_SCOPES

```ts
AIO_COMMERCE_AUTH_IMS_SCOPES: string | string[];
```

##### AIO\_COMMERCE\_AUTH\_IMS\_TECHNICAL\_ACCOUNT\_EMAIL

```ts
AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: string;
```

##### AIO\_COMMERCE\_AUTH\_IMS\_TECHNICAL\_ACCOUNT\_ID

```ts
AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: string;
```
