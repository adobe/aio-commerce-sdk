# `CommerceEventSubscription`

```ts
type CommerceEventSubscription = {
  destination: "default" | string;
  fields: CommerceEventSubscriptionField[];
  hipaa_audit_required: boolean;
  name: string;
  parent: string;
  priority: boolean;
  provider_id: "default" | string;
  rules: CommerceEventSubscriptionRule[];
};
```

Defined in: [commerce/api/event-subscriptions/types.ts:29](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L29)

Defines the structure of a Commerce event subscription.

## Properties

### destination

```ts
destination: "default" | string;
```

Defined in: [commerce/api/event-subscriptions/types.ts:37](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L37)

---

### fields

```ts
fields: CommerceEventSubscriptionField[];
```

Defined in: [commerce/api/event-subscriptions/types.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L34)

---

### hipaa_audit_required

```ts
hipaa_audit_required: boolean;
```

Defined in: [commerce/api/event-subscriptions/types.ts:39](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L39)

---

### name

```ts
name: string;
```

Defined in: [commerce/api/event-subscriptions/types.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L30)

---

### parent

```ts
parent: string;
```

Defined in: [commerce/api/event-subscriptions/types.ts:31](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L31)

---

### priority

```ts
priority: boolean;
```

Defined in: [commerce/api/event-subscriptions/types.ts:38](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L38)

---

### provider_id

```ts
provider_id: "default" | string;
```

Defined in: [commerce/api/event-subscriptions/types.ts:32](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L32)

---

### rules

```ts
rules: CommerceEventSubscriptionRule[];
```

Defined in: [commerce/api/event-subscriptions/types.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L35)
