# `IoEventRegistration`

```ts
type IoEventRegistration = {
  client_id: string;
  created_date?: string;
  delivery_type: DeliveryType;
  description?: string;
  destination_metadata?: DestinationMetadata;
  enabled?: boolean;
  events_of_interest: EventsOfInterest[];
  events_url?: string;
  id: string;
  integration_status: string;
  name: string;
  parent_client_id?: string;
  registration_id: string;
  runtime_action?: string;
  status: string;
  subscriber_filters?: SubscriberFilterModel[];
  type: string;
  updated_date?: string;
  webhook_url?: string;
};
```

Defined in: [io-events/api/event-registrations/types.ts:39](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L39)

Defines the base fields of an I/O event registration entity.

## Properties

### client_id

```ts
client_id: string;
```

Defined in: [io-events/api/event-registrations/types.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L43)

---

### created_date?

```ts
optional created_date: string;
```

Defined in: [io-events/api/event-registrations/types.ts:55](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L55)

---

### delivery_type

```ts
delivery_type: DeliveryType;
```

Defined in: [io-events/api/event-registrations/types.ts:51](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L51)

---

### description?

```ts
optional description: string;
```

Defined in: [io-events/api/event-registrations/types.ts:42](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L42)

---

### destination_metadata?

```ts
optional destination_metadata: DestinationMetadata;
```

Defined in: [io-events/api/event-registrations/types.ts:57](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L57)

---

### enabled?

```ts
optional enabled: boolean;
```

Defined in: [io-events/api/event-registrations/types.ts:54](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L54)

---

### events_of_interest

```ts
events_of_interest: EventsOfInterest[];
```

Defined in: [io-events/api/event-registrations/types.ts:49](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L49)

---

### events_url?

```ts
optional events_url: string;
```

Defined in: [io-events/api/event-registrations/types.ts:52](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L52)

---

### id

```ts
id: string;
```

Defined in: [io-events/api/event-registrations/types.ts:40](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L40)

---

### integration_status

```ts
integration_status: string;
```

Defined in: [io-events/api/event-registrations/types.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L48)

---

### name

```ts
name: string;
```

Defined in: [io-events/api/event-registrations/types.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L41)

---

### parent_client_id?

```ts
optional parent_client_id: string;
```

Defined in: [io-events/api/event-registrations/types.ts:44](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L44)

---

### registration_id

```ts
registration_id: string;
```

Defined in: [io-events/api/event-registrations/types.ts:50](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L50)

---

### runtime_action?

```ts
optional runtime_action: string;
```

Defined in: [io-events/api/event-registrations/types.ts:53](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L53)

---

### status

```ts
status: string;
```

Defined in: [io-events/api/event-registrations/types.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L46)

---

### subscriber_filters?

```ts
optional subscriber_filters: SubscriberFilterModel[];
```

Defined in: [io-events/api/event-registrations/types.ts:58](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L58)

---

### type

```ts
type: string;
```

Defined in: [io-events/api/event-registrations/types.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L47)

---

### updated_date?

```ts
optional updated_date: string;
```

Defined in: [io-events/api/event-registrations/types.ts:56](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L56)

---

### webhook_url?

```ts
optional webhook_url: string;
```

Defined in: [io-events/api/event-registrations/types.ts:45](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L45)
