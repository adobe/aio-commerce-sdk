# `CommerceWebhook`

```ts
type CommerceWebhook = {
  batch_name: string;
  batch_order?: number;
  developer_console_oauth?: CommerceWebhookDeveloperConsoleOAuth;
  fallback_error_message?: string;
  fields?: CommerceWebhookField[];
  headers?: CommerceWebhookHeader[];
  hook_name: string;
  method?: string;
  priority?: number;
  required?: boolean;
  rules?: CommerceWebhookRule[];
  soft_timeout?: number;
  timeout?: number;
  ttl?: number;
  url: string;
  webhook_method: string;
  webhook_type: string;
};
```

Defined in: [api/webhooks/types.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L41)

A single Commerce webhook subscription as returned by GET /webhooks/list.

## Properties

### batch\_name

```ts
batch_name: string;
```

Defined in: [api/webhooks/types.ts:44](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L44)

---

### batch\_order?

```ts
batch_order?: number;
```

Defined in: [api/webhooks/types.ts:45](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L45)

---

### developer\_console\_oauth?

```ts
developer_console_oauth?: CommerceWebhookDeveloperConsoleOAuth;
```

Defined in: [api/webhooks/types.ts:58](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L58)

---

### fallback\_error\_message?

```ts
fallback_error_message?: string;
```

Defined in: [api/webhooks/types.ts:53](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L53)

---

### fields?

```ts
fields?: CommerceWebhookField[];
```

Defined in: [api/webhooks/types.ts:55](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L55)

---

### headers?

```ts
headers?: CommerceWebhookHeader[];
```

Defined in: [api/webhooks/types.ts:57](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L57)

---

### hook\_name

```ts
hook_name: string;
```

Defined in: [api/webhooks/types.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L46)

---

### method?

```ts
method?: string;
```

Defined in: [api/webhooks/types.ts:52](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L52)

---

### priority?

```ts
priority?: number;
```

Defined in: [api/webhooks/types.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L48)

---

### required?

```ts
required?: boolean;
```

Defined in: [api/webhooks/types.ts:49](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L49)

---

### rules?

```ts
rules?: CommerceWebhookRule[];
```

Defined in: [api/webhooks/types.ts:56](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L56)

---

### soft\_timeout?

```ts
soft_timeout?: number;
```

Defined in: [api/webhooks/types.ts:50](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L50)

---

### timeout?

```ts
timeout?: number;
```

Defined in: [api/webhooks/types.ts:51](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L51)

---

### ttl?

```ts
ttl?: number;
```

Defined in: [api/webhooks/types.ts:54](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L54)

---

### url

```ts
url: string;
```

Defined in: [api/webhooks/types.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L47)

---

### webhook\_method

```ts
webhook_method: string;
```

Defined in: [api/webhooks/types.ts:42](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L42)

---

### webhook\_type

```ts
webhook_type: string;
```

Defined in: [api/webhooks/types.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L43)
