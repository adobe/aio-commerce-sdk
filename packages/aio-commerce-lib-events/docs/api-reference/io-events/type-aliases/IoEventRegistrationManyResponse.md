# `IoEventRegistrationManyResponse`

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

Defined in: [io-events/api/event-registrations/types.ts:83](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L83)

Defines the fields of many I/O event registration entities returned by the Adobe I/O Events API (workspace-specific).

## Properties

### \_embedded

```ts
_embedded: {
  registrations: IoEventRegistrationHalModel[];
};
```

Defined in: [io-events/api/event-registrations/types.ts:84](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L84)

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

Defined in: [io-events/api/event-registrations/types.ts:87](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L87)

#### self

```ts
self: HALLink;
```
