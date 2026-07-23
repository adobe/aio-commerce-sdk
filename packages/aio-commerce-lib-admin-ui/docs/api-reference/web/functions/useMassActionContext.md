# `useMassActionContext()`

```ts
function useMassActionContext(): Result<MassActionContext>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-extension-context.ts:32](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-extension-context.ts#L32)

Returns the context for a mass-action extension point: the selected row IDs the action was
triggered with. The value is read from the host-provided Commerce context.

Returns an error outside the Commerce shared context, or when the mass-action selection is
missing, empty, or contains a non-string row ID.

## Returns

`Result`\<[`MassActionContext`](../type-aliases/MassActionContext.md)\>
