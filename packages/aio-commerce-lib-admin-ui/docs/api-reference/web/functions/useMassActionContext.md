# `useMassActionContext()`

```ts
function useMassActionContext(): Result<MassActionContext>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-extension-context.ts:32](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-extension-context.ts#L32)

Returns the context for a mass-action extension point: the selected row IDs the action was
triggered with. The value is read from the host-provided Commerce context.

Returns an error outside the Commerce shared context, or when the mass-action selection is
missing, empty, or contains a non-string row ID.

## Returns

`Result`\<[`MassActionContext`](../type-aliases/MassActionContext.md)\>
