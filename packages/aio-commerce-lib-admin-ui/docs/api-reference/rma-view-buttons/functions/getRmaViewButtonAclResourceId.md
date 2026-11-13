# `getRmaViewButtonAclResourceId()`

```ts
function getRmaViewButtonAclResourceId(
  metadataId: string,
  buttonId: string,
): string;
```

Defined in: [aio-commerce-lib-admin-ui/source/rma-view-buttons/acl-resource-id.ts:28](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-admin-ui/source/rma-view-buttons/acl-resource-id.ts#L28)

Derives the Commerce ACL resource ID for a return view button.
App and button IDs are trimmed, lowercased, and sanitized independently.

## Parameters

| Parameter    | Type     | Description                                        |
| ------------ | -------- | -------------------------------------------------- |
| `metadataId` | `string` | The application's `metadata.id` value.             |
| `buttonId`   | `string` | The button's `adminUi.rma.viewButtons[].id` value. |

## Returns

`string`

The return view-button leaf ID, or an empty string when `metadataId` is blank.

## Example

```ts
getRmaViewButtonAclResourceId("returns-app", "approve-return");
// "Magento_CommerceBackendUix::adminuisdk_app_returns_app_rma_viewbuttons_approve_return"
```
