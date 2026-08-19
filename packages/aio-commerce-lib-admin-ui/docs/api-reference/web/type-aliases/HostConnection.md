# `HostConnection`

```ts
type HostConnection = {
  close: () => Promise<void>;
  closeWithError: () => Promise<void>;
};
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts#L47)

Actions for closing the extension iframe and returning control to the Commerce Admin.

## Properties

### close

```ts
close: () => Promise<void>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts:49](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts#L49)

Closes the iframe and navigates back to the originating grid or order.

#### Returns

`Promise`\<`void`\>

---

### closeWithError

```ts
closeWithError: () => Promise<void>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts:52](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts#L52)

Closes the iframe and navigates back, flagging the originating page that an error occurred.

#### Returns

`Promise`\<`void`\>
