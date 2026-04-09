# `ExceptionOperation`

```ts
type ExceptionOperation = {
  class?: string;
  message?: string;
  op: "exception";
};
```

Defined in: [responses/operations/types.ts:25](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L25)

Exception operation response
Causes Commerce to terminate the process that triggered the original event.

## Properties

### class?

```ts
optional class: string;
```

Defined in: [responses/operations/types.ts:28](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L28)

Specifies the exception class. If not set, \Magento\Framework\Exception\LocalizedException will be thrown.

---

### message?

```ts
optional message: string;
```

Defined in: [responses/operations/types.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L30)

Specifies the exception message. If not set, fallbackErrorMessage or system default will be used.

---

### op

```ts
op: "exception";
```

Defined in: [responses/operations/types.ts:26](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L26)
