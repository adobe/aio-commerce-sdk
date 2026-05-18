---
title: "successOperation()"
editUrl: false
prev: false
next: false
---

```ts
function successOperation(): SuccessOperation;
```

Defined in: [responses/operations/presets.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-webhooks/source/responses/operations/presets.ts#L30)

Creates a success operation response
The process that triggered the original event continues without any changes.

## Returns

[`SuccessOperation`](../type-aliases/SuccessOperation.md)

## Example

```typescript
return successOperation();
```
