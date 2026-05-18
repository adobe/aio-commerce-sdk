---
title: "IoEventRegistrationManyResponse"
editUrl: false
prev: false
next: false
---

```ts
type IoEventRegistrationManyResponse = {
  _embedded: {
    registrations: IoEventRegistrationHalModel[];
  };
  _links: {
    self: HALLink;
  };
};
```

Defined in: [io-events/api/event-registrations/types.ts:83](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L83)

Defines the fields of many I/O event registration entities returned by the Adobe I/O Events API (workspace-specific).

## Properties

### \_embedded

```ts
_embedded: {
  registrations: IoEventRegistrationHalModel[];
};
```

Defined in: [io-events/api/event-registrations/types.ts:84](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L84)

#### registrations

```ts
registrations: IoEventRegistrationHalModel[];
```

---

### \_links

```ts
_links: {
  self: HALLink;
}
```

Defined in: [io-events/api/event-registrations/types.ts:87](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L87)

#### self

```ts
self: HALLink;
```
