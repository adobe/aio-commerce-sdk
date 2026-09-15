# `associationRuntimeAction()`

```ts
function associationRuntimeAction(): (
  params: RuntimeActionParams,
) => Promise<ActionResponse>;
```

Defined in: [aio-commerce-lib-app/source/actions/association/index.ts:26](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/actions/association/index.ts#L26)

Factory to create the route handler for the `association` action.

The `association` action manages the lifecycle of the Commerce instance the
app is associated with — `POST /` stores the data when the app is associated,
and `DELETE /` clears it on unassociation. Runtime actions consume the data
via `getCommerceInstance` / `getCommerceClient` from the root entrypoint.

## Returns

(`params`: `RuntimeActionParams`) => `Promise`\<`ActionResponse`\>
