# `HostConnection`

```ts
type HostConnection = {
  close: () => Promise<void>;
  closeWithError: () => Promise<void>;
};
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts#L47)

Actions for closing the extension iframe and returning control to the Commerce Admin.

## Properties

### close

```ts
close: () => Promise<void>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts:49](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts#L49)

Closes the iframe and navigates back to the originating grid or order.

#### Returns

`Promise`\<`void`\>

---

### closeWithError

```ts
closeWithError: () => Promise<void>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts:52](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts#L52)

Closes the iframe and navigates back, flagging the originating page that an error occurred.

#### Returns

`Promise`\<`void`\>
