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

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:40](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L40)

Shared context available to all steps during installation.

## Properties

### appData

```ts
appData: AppData;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:42](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L42)

The credentials of the app being installed

---

### customScripts?

```ts
optional customScripts: Record<string, unknown>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:58](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L58)

Custom scripts defined in the configuration (if any).

---

### logger

```ts
logger: ReturnType<typeof AioLogger>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:55](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L55)

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

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:45](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L45)

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
