# Credit memo view buttons on backend-ui/2

- **Ticket:** [ACCS-2195](https://jira.corp.adobe.com/browse/ACCS-2195)
- **Created:** 2026-10-27
- [ ] **Implemented**

## Summary

Add credit memo detail-page buttons under `adminUi.creditMemo.viewButtons` on
`commerce/backend-ui/2`, following invoice view buttons with view and worker
variants. Provide credit memo-specific runtime helpers, an ACL resource helper,
and a React context hook.

## Motivation

Apps can extend credit memo grids but cannot configure buttons on individual
credit memos. Merchants need server-side actions such as an offline refund
triggered from the credit memo page, and iframe-based credit memo details, with
the same validation and generation support as order and invoice buttons.

The goal is end-to-end credit memo button support. Shipment buttons, credit memo
mass actions, and legacy backend-ui/1 support are out of scope.

## Developer experience

```ts
adminUi: {
  creditMemo: {
    viewButtons: [
      {
        id: "credit-memo-details",
        label: "Credit memo details",
        type: "view",
        path: "#/creditmemo",
        title: "Custom credit memo details",
        sortOrder: 100,
        sandboxPermissions: ["allow-modals"],
      },
      {
        id: "refund-offline",
        label: "Refund Offline",
        type: "worker",
        runtimeAction: "creditmemo/refund-offline",
        timeout: 15,
        sortOrder: 110,
        confirm: { message: "Refund this credit memo offline?" },
        notifications: {
          success: "Credit memo refunded successfully.",
          error: "Unable to refund the credit memo.",
        },
      },
    ],
  },
}
```

Worker helpers are available from
`@adobe/aio-commerce-lib-admin-ui/credit-memo-view-buttons` and the corresponding
meta-package subpath. Iframe pages use `useCreditMemoViewButtonContext` and the
existing host connection APIs.

## Design

Reuse the invoice view-button validation, including the optional iframe `title`.
Worker buttons require `runtimeAction`; view buttons require `path` and allow
`sandboxPermissions`. Variant-incompatible fields are rejected. Button ids must
remain unique after Commerce sanitization.

Credit memo-only registrations activate backend-ui/2. Credit memo is added to
the shared view-button entity list, so worker runtime actions are deduplicated,
view buttons trigger web scaffolding and a `view` operation, and the
installation and upgrade planner enumerates credit memo buttons individually.

Credit memo runtime helpers validate the credit memo request payload and reuse
the existing view-button success and error contract. The ACL helper derives a
credit memo-specific resource id (`…_creditmemo_viewbuttons_<buttonId>`). The
context hook reads `creditMemoId` from the URL or hash query.

Update the hand-maintained app-config OpenAPI schema, usage documentation,
plugin guidance, package entrypoints, and tests. Existing order and invoice
behavior is unchanged.

## Drawbacks

Adds public entrypoints and entity-specific helpers that must stay aligned with
the Commerce Admin UI contract.

## Rationale and alternatives

Entity-specific helpers mirror the existing order and invoice APIs and avoid
breaking consumers. Generic public button helpers would require a broader API
redesign.

## Unresolved questions

Commerce must support this extension point before the configured buttons can
render.

Resolved during E2E testing: the Commerce host sends the button id as `buttonId`
and the request id as an `X-Request-ID` header for all view-button entities,
while the SDK parsers expected `{ requestId, id, <entity>Id }` in the body. The
order, invoice and credit memo parsers now map `buttonId` to `id` and
`__ow_headers["x-request-id"]` to `requestId` (explicit values win), so the
documented parsed shape is unchanged.

## Future possibilities

Add equivalent detail-page buttons for shipments when Commerce supports them.
