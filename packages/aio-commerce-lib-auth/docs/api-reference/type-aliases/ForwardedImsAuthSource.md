# `ForwardedImsAuthSource`

```ts
type ForwardedImsAuthSource = v.InferOutput<
  typeof ForwardedImsAuthSourceSchema
>;
```

Defined in: [ims-auth/forwarding.ts:65](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-auth/source/lib/ims-auth/forwarding.ts#L65)

Discriminated union for different sources of forwarded IMS auth credentials.

- `headers`: Extract credentials from a raw headers object (e.g. an HTTP request).
- `getter`: Use a function that returns IMS auth headers (sync or async).
- `params`: Read credentials from a params object using `AIO_COMMERCE_AUTH_IMS_TOKEN` and `AIO_COMMERCE_AUTH_IMS_API_KEY` keys.
