---
title: "IoEventRegistrationPaginatedResponse"
editUrl: false
prev: false
next: false
---

```ts
type IoEventRegistrationPaginatedResponse = {
  _embedded: {
    registrations: IoEventRegistrationHalModel[];
  };
  _links: {
    first?: HALLink;
    last?: HALLink;
    next?: HALLink;
    prev?: HALLink;
    self: HALLink;
  };
  page: PageMetadata;
};
```

Defined in: [io-events/api/event-registrations/types.ts:93](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L93)

Defines the fields of paginated I/O event registration entities returned by the Adobe I/O Events API (consumer org-level).

## Properties

### \_embedded

```ts
_embedded: {
  registrations: IoEventRegistrationHalModel[];
};
```

Defined in: [io-events/api/event-registrations/types.ts:95](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L95)

#### registrations

```ts
registrations: IoEventRegistrationHalModel[];
```

---

### \_links

```ts
_links: {
  first?: HALLink;
  last?: HALLink;
  next?: HALLink;
  prev?: HALLink;
  self: HALLink;
};
```

Defined in: [io-events/api/event-registrations/types.ts:98](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L98)

#### first?

```ts
optional first?: HALLink;
```

#### last?

```ts
optional last?: HALLink;
```

#### next?

```ts
optional next?: HALLink;
```

#### prev?

```ts
optional prev?: HALLink;
```

#### self

```ts
self: HALLink;
```

---

### page

```ts
page: PageMetadata;
```

Defined in: [io-events/api/event-registrations/types.ts:94](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L94)
