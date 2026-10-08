# Invoice view buttons on backend-ui/2

- **Ticket:** [CEXT-6859](https://jira.corp.adobe.com/browse/CEXT-6859)
- **Created:** 2026-10-07
- [ ] **Implemented**

## Summary

Add invoice detail-page buttons under `adminUi.invoice.viewButtons` on
`commerce/backend-ui/2`, following order view buttons with view and worker variants.
Provide invoice-specific runtime helpers, an ACL resource helper, and a React
context hook.

## Motivation

Apps can extend invoice grids but cannot configure buttons on individual invoices.
Developers need iframe-based invoice details and server-side actions such as sending
an invoice, with the same validation and generation support as order buttons.

The goal is end-to-end invoice button support. Credit memo and shipment buttons,
invoice mass actions, and legacy backend-ui/1 migration are out of scope.

## Developer experience

```ts
adminUi: {
  invoice: {
    viewButtons: [
      {
        id: "invoice-details",
        label: "Invoice details",
        type: "view",
        path: "#/invoice-details",
        title: "Custom invoice details",
        sortOrder: 100,
        sandboxPermissions: ["allow-modals"],
      },
      {
        id: "send-invoice",
        label: "Send invoice",
        type: "worker",
        runtimeAction: "invoice/send",
        timeout: 15,
        sortOrder: 110,
        confirm: { message: "Send this invoice?" },
        notifications: {
          success: "Invoice sent successfully.",
          error: "Unable to send the invoice.",
        },
      },
    ],
  },
}
```

Worker helpers are available from
`@adobe/aio-commerce-lib-admin-ui/invoice-view-buttons` and the corresponding
meta-package subpath. Iframe pages use `useInvoiceViewButtonContext` and the
existing host connection APIs.

## Design

Reuse order view-button validation, with an optional invoice iframe `title`.
Worker buttons require `runtimeAction`; view buttons require `path` and allow
`sandboxPermissions`. Variant-incompatible fields are rejected. Button ids must
remain unique after Commerce sanitization.

Invoice-only registrations activate backend-ui/2. Worker runtime actions are
deduplicated across all extension points. View buttons trigger web scaffolding
and a `view` operation. The installation and upgrade planner enumerates invoice
buttons individually, including additions, changes, and removals.

Invoice runtime helpers validate the invoice request payload and reuse the
existing view-button success and error contract. The ACL helper derives an
invoice-specific resource id. The context hook validates the invoice extension
point before exposing its invoice id.

Update the hand-maintained app-config OpenAPI schema, usage documentation, plugin
guidance, package entrypoints, and tests. Existing order behavior is unchanged.

## Drawbacks

Adds public entrypoints and entity-specific helpers that must stay aligned with
the Commerce Admin UI contract.

## Rationale and alternatives

Entity-specific helpers mirror existing order APIs and avoid breaking consumers.
Generic public button helpers would require a broader API redesign. Hand-written
registrations do not provide validation, generated operations, or upgrade planning.

## Unresolved questions

The proposed worker payload is `{ requestId, id, invoiceId }`, and the iframe
context reads `invoiceId` from the URL or hash query, matching the order pattern.
These invoice-specific contracts are not yet verified against Commerce host
fixtures. The public invoice extension documentation currently lists grid columns
only. Confirm these contracts against the host implementation before release.
Commerce must support this extension point before the configured buttons can render.

## Future possibilities

Add equivalent detail-page buttons for other entities when Commerce supports them.
