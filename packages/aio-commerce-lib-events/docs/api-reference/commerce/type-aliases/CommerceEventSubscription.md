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

Defined in: [packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts:17](https://github.com/adobe/aio-commerce-sdk/blob/5a56cf6f89369fbe4cacf586ea1b3d08993680a9/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L17)

Defines the structure of a Commerce event subscription.

## Properties

### destination

```ts
destination: "default" | string;
```

Defined in: [packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts:25](https://github.com/adobe/aio-commerce-sdk/blob/5a56cf6f89369fbe4cacf586ea1b3d08993680a9/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L25)

---

### fields

```ts
fields: CommerceEventSubscriptionField[];
```

Defined in: [packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts:22](https://github.com/adobe/aio-commerce-sdk/blob/5a56cf6f89369fbe4cacf586ea1b3d08993680a9/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L22)

---

### hipaa_audit_required

```ts
hipaa_audit_required: boolean;
```

Defined in: [packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts:27](https://github.com/adobe/aio-commerce-sdk/blob/5a56cf6f89369fbe4cacf586ea1b3d08993680a9/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L27)

---

### name

```ts
name: string;
```

Defined in: [packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts:18](https://github.com/adobe/aio-commerce-sdk/blob/5a56cf6f89369fbe4cacf586ea1b3d08993680a9/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L18)

---

### parent

```ts
parent: string;
```

Defined in: [packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts:19](https://github.com/adobe/aio-commerce-sdk/blob/5a56cf6f89369fbe4cacf586ea1b3d08993680a9/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L19)

---

### priority

```ts
priority: boolean;
```

Defined in: [packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts:26](https://github.com/adobe/aio-commerce-sdk/blob/5a56cf6f89369fbe4cacf586ea1b3d08993680a9/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L26)

---

### provider_id

```ts
provider_id: "default" | string;
```

Defined in: [packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts:20](https://github.com/adobe/aio-commerce-sdk/blob/5a56cf6f89369fbe4cacf586ea1b3d08993680a9/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L20)

---

### rules

```ts
rules: CommerceEventSubscriptionRule[];
```

Defined in: [packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/5a56cf6f89369fbe4cacf586ea1b3d08993680a9/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L23)
