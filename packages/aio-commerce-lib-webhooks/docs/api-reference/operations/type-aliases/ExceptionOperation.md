# `ExceptionOperation`

```ts
type ExceptionOperation = {
  class?: string;
  message?: string;
  op: "exception";
};
```

Defined in: [operations/helpers.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/helpers.ts#L43)

Exception operation response
Causes Commerce to terminate the process that triggered the original event.

## Properties

### class?

```ts
optional class: string;
```

Defined in: [operations/helpers.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/helpers.ts#L46)

Specifies the exception class. If not set, \Magento\Framework\Exception\LocalizedException will be thrown.

---

### message?

```ts
optional message: string;
```

Defined in: [operations/helpers.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/helpers.ts#L48)

Specifies the exception message. If not set, fallbackErrorMessage or system default will be used.

---

### op

```ts
op: "exception";
```

Defined in: [operations/helpers.ts:44](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/helpers.ts#L44)
