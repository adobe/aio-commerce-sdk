# `ExceptionOperation`

```ts
type ExceptionOperation = {
  class?: string;
  message?: string;
  op: "exception";
};
```

Defined in: [responses/operations/types.ts:25](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L25)

Exception operation response
Causes Commerce to terminate the process that triggered the original event.

## Properties

### class?

```ts
optional class?: string;
```

Defined in: [responses/operations/types.ts:28](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L28)

Specifies the exception class. If not set, \Magento\Framework\Exception\LocalizedException will be thrown.

---

### message?

```ts
optional message?: string;
```

Defined in: [responses/operations/types.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L30)

Specifies the exception message. If not set, fallbackErrorMessage or system default will be used.

---

### op

```ts
op: "exception";
```

Defined in: [responses/operations/types.ts:26](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L26)
