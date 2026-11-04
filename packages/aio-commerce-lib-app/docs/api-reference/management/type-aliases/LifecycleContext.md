# `LifecycleContext`

```ts
type LifecycleContext = {
  appData: AppData;
  appId: string;
  customScripts?: Record<string, unknown>;
  logger: ReturnType<typeof AioLogger>;
  params: RuntimeActionParams & {
    AIO_COMMERCE_AUTH_IMS_CLIENT_ID?: string;
    AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS?: string | string[];
    AIO_COMMERCE_AUTH_IMS_ORG_ID?: string;
    AIO_COMMERCE_AUTH_IMS_SCOPES?: string | string[];
    AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL?: string;
    AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID?: string;
  };
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:22](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L22)

Shared context available to all steps during a lifecycle workflow.

## Properties

### appData

```ts
appData: AppData;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:27](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L27)

The credentials of the app being managed.

---

### appId

```ts
appId: string;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:24](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L24)

The `metadata.id` of the app being managed.

---

### customScripts?

```ts
customScripts?: Record<string, unknown>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:55](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L55)

Custom scripts defined in the configuration (if any).

---

### logger

```ts
logger: ReturnType<typeof AioLogger>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:52](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L52)

Logger instance for workflow logging.

---

### params

```ts
params: RuntimeActionParams & {
  AIO_COMMERCE_AUTH_IMS_CLIENT_ID?: string;
  AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS?: string | string[];
  AIO_COMMERCE_AUTH_IMS_ORG_ID?: string;
  AIO_COMMERCE_AUTH_IMS_SCOPES?: string | string[];
  AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL?: string;
  AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID?: string;
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:36](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L36)

The raw action parameters from the App Builder runtime action.

The `AIO_COMMERCE_AUTH_IMS_*` fields are deprecated: generated actions receive
OAuth Server-to-Server credentials via the `include-ims-credentials` annotation.
Use `resolveImsAuthParams(context.params)` from `@adobe/aio-commerce-lib-auth` instead.

#### Type Declaration

##### ~~AIO\_COMMERCE\_AUTH\_IMS\_CLIENT\_ID?~~

```ts
AIO_COMMERCE_AUTH_IMS_CLIENT_ID?: string;
```

###### Deprecated

Use `resolveImsAuthParams(context.params).clientId` instead.

##### ~~AIO\_COMMERCE\_AUTH\_IMS\_CLIENT\_SECRETS?~~

```ts
AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS?: string | string[];
```

###### Deprecated

Use `resolveImsAuthParams(context.params).clientSecrets` instead.

##### ~~AIO\_COMMERCE\_AUTH\_IMS\_ORG\_ID?~~

```ts
AIO_COMMERCE_AUTH_IMS_ORG_ID?: string;
```

###### Deprecated

Use `resolveImsAuthParams(context.params).imsOrgId` instead.

##### ~~AIO\_COMMERCE\_AUTH\_IMS\_SCOPES?~~

```ts
AIO_COMMERCE_AUTH_IMS_SCOPES?: string | string[];
```

###### Deprecated

Use `resolveImsAuthParams(context.params).scopes` instead.

##### ~~AIO\_COMMERCE\_AUTH\_IMS\_TECHNICAL\_ACCOUNT\_EMAIL?~~

```ts
AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL?: string;
```

###### Deprecated

Use `resolveImsAuthParams(context.params).technicalAccountEmail` instead.

##### ~~AIO\_COMMERCE\_AUTH\_IMS\_TECHNICAL\_ACCOUNT\_ID?~~

```ts
AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID?: string;
```

###### Deprecated

Use `resolveImsAuthParams(context.params).technicalAccountId` instead.
