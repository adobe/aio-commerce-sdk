# `ExceptionOperation`

```ts
type ExceptionOperation = {
  message?: string;
  op: "exception";
  type?: string;
};
```

Defined in: [responses/operations/types.ts:25](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L25)

Exception operation response
Causes Commerce to terminate the process that triggered the original event.

## Properties

### message?

```ts
message?: string;
```

Defined in: [responses/operations/types.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L30)

Specifies the exception message. If not set, fallbackErrorMessage or system default will be used.

---

### op

```ts
op: "exception";
```

Defined in: [responses/operations/types.ts:26](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L26)

---

### type?

```ts
type?: string;
```

Defined in: [responses/operations/types.ts:28](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L28)

Specifies the exception class. If not set, \Magento\Framework\Exception\LocalizedException will be thrown.
