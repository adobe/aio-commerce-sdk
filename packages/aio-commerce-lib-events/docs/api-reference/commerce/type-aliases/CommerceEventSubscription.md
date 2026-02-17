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

Defined in: [commerce/api/event-subscriptions/types.ts:27](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L27)

Defines the structure of a Commerce event subscription.

## Properties

### destination

```ts
destination: "default" | string;
```

Defined in: [commerce/api/event-subscriptions/types.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L35)

---

### fields

```ts
fields: CommerceEventSubscriptionField[];
```

Defined in: [commerce/api/event-subscriptions/types.ts:32](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L32)

---

### hipaa_audit_required

```ts
hipaa_audit_required: boolean;
```

Defined in: [commerce/api/event-subscriptions/types.ts:37](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L37)

---

### name

```ts
name: string;
```

Defined in: [commerce/api/event-subscriptions/types.ts:28](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L28)

---

### parent

```ts
parent: string;
```

Defined in: [commerce/api/event-subscriptions/types.ts:29](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L29)

---

### priority

```ts
priority: boolean;
```

Defined in: [commerce/api/event-subscriptions/types.ts:36](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L36)

---

### provider_id

```ts
provider_id: "default" | string;
```

Defined in: [commerce/api/event-subscriptions/types.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L30)

---

### rules

```ts
rules: CommerceEventSubscriptionRule[];
```

Defined in: [commerce/api/event-subscriptions/types.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/types.ts#L33)
