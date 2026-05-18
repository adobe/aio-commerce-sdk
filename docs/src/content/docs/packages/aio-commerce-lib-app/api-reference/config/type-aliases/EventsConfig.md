---
title: "EventsConfig"
editUrl: false
prev: false
next: false
---

```ts
type EventsConfig = CommerceAppConfigOutputModel & {
  eventing: NonNullable<CommerceAppConfigOutputModel["eventing"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:280](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L280)

Config type when eventing is present.

## Type Declaration

### eventing

```ts
eventing: NonNullable<CommerceAppConfigOutputModel["eventing"]>;
```
