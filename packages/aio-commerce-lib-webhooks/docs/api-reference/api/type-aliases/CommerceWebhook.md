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

Defined in: [api/webhooks/types.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L41)

A single Commerce webhook subscription as returned by GET /webhooks/list.

## Properties

### batch_name

```ts
batch_name: string;
```

Defined in: [api/webhooks/types.ts:44](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L44)

---

### batch_order?

```ts
optional batch_order: number;
```

Defined in: [api/webhooks/types.ts:45](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L45)

---

### developer_console_oauth?

```ts
optional developer_console_oauth: CommerceWebhookDeveloperConsoleOAuth;
```

Defined in: [api/webhooks/types.ts:58](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L58)

---

### fallback_error_message?

```ts
optional fallback_error_message: string;
```

Defined in: [api/webhooks/types.ts:53](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L53)

---

### fields?

```ts
optional fields: CommerceWebhookField[];
```

Defined in: [api/webhooks/types.ts:55](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L55)

---

### headers?

```ts
optional headers: CommerceWebhookHeader[];
```

Defined in: [api/webhooks/types.ts:57](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L57)

---

### hook_name

```ts
hook_name: string;
```

Defined in: [api/webhooks/types.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L46)

---

### method?

```ts
optional method: string;
```

Defined in: [api/webhooks/types.ts:52](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L52)

---

### priority?

```ts
optional priority: number;
```

Defined in: [api/webhooks/types.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L48)

---

### required?

```ts
optional required: boolean;
```

Defined in: [api/webhooks/types.ts:49](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L49)

---

### rules?

```ts
optional rules: CommerceWebhookRule[];
```

Defined in: [api/webhooks/types.ts:56](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L56)

---

### soft_timeout?

```ts
optional soft_timeout: number;
```

Defined in: [api/webhooks/types.ts:50](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L50)

---

### timeout?

```ts
optional timeout: number;
```

Defined in: [api/webhooks/types.ts:51](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L51)

---

### ttl?

```ts
optional ttl: number;
```

Defined in: [api/webhooks/types.ts:54](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L54)

---

### url

```ts
url: string;
```

Defined in: [api/webhooks/types.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L47)

---

### webhook_method

```ts
webhook_method: string;
```

Defined in: [api/webhooks/types.ts:42](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L42)

---

### webhook_type

```ts
webhook_type: string;
```

Defined in: [api/webhooks/types.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-webhooks/source/api/webhooks/types.ts#L43)
