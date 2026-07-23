# `HostConnection`

```ts
type HostConnection = {
  close: () => Promise<void>;
  closeWithError: () => Promise<void>;
};
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts#L47)

Actions for closing the extension iframe and returning control to the Commerce Admin.

## Properties

### close

```ts
close: () => Promise<void>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts:49](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts#L49)

Closes the iframe and navigates back to the originating grid or order.

#### Returns

`Promise`\<`void`\>

---

### closeWithError

```ts
closeWithError: () => Promise<void>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts:52](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts#L52)

Closes the iframe and navigates back, flagging the originating page that an error occurred.

#### Returns

`Promise`\<`void`\>
