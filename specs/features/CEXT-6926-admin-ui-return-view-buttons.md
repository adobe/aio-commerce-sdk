# Return view buttons on backend-ui/2

- **Ticket:** [CEXT-6926](https://jira.corp.adobe.com/browse/CEXT-6926)
- **Created:** 2026-11-09
- [x] **Implemented**

## Summary

Add return (RMA) detail-page buttons under `adminUi.rma.viewButtons` on `commerce/backend-ui/2`, following credit memo view buttons with view and worker variants. Provide return-specific runtime helpers, an ACL resource helper, and a React context hook.

## Motivation

Apps cannot configure buttons on the Commerce Admin return (RMA) view page. Merchants need server-side actions such as a custom return flow triggered from the return page, and iframe-based return details, with the same validation and generation support as order, invoice, and credit memo buttons.

The goal is end-to-end return button support. Return grid columns, return mass actions, and legacy backend-ui/1 support are out of scope.

## Developer experience

```ts
adminUi: {
  rma: {
    viewButtons: [
      {
        id: "return-details",
        label: "Return details",
        type: "view",
        path: "#/return",
        title: "Custom return details",
        sortOrder: 100,
        sandboxPermissions: ["allow-modals"],
      },
      {
        id: "custom-return-flow",
        label: "Custom Return Flow",
        type: "worker",
        runtimeAction: "rma/custom-flow",
        timeout: 15,
        sortOrder: 110,
        confirm: { message: "Run the custom return flow?" },
        notifications: {
          success: "Custom return flow completed.",
          error: "Unable to run the custom return flow.",
        },
      },
    ],
  },
}
```

Worker helpers are available from `@adobe/aio-commerce-lib-admin-ui/rma-view-buttons` and the corresponding meta-package subpath (`@adobe/aio-commerce-sdk/admin-ui/rma-view-buttons`). Iframe pages use `useRmaViewButtonContext` and the existing host connection APIs.

## Design

The config key is `rma`, matching the Commerce `Magento_Rma` module; human-readable documentation calls the entity a "return". The `adminUi.rma` object only accepts `viewButtons`.

Reuse the invoice and credit memo view-button validation, including the optional iframe `title`. Worker buttons require `runtimeAction`; view buttons require `path` and allow `sandboxPermissions`. Variant-incompatible fields are rejected. Button ids must remain unique after Commerce sanitization.

Return-only registrations activate backend-ui/2. `rma` is added to the shared view-button entity list, so worker runtime actions are deduplicated, view buttons trigger web scaffolding and a `view` operation, and the installation and upgrade planner enumerates return buttons individually (`rma.view-button.<id>`).

Commerce POSTs `{ rmaId, buttonId }` to the worker and sends the request id in the `X-Request-ID` header. Return runtime helpers reuse the shared view-button request normalizer, validate `{ requestId, id, rmaId }`, and reuse the existing view-button success and error contract. The ACL helper derives a return-specific resource id (`…_rma_viewbuttons_<buttonId>`). The context hook reads `rmaId` from the URL or hash query.

Update the hand-maintained app-config OpenAPI schema, usage documentation, plugin guidance, package entrypoints, and tests. Existing order, invoice, and credit memo behavior is unchanged.

## Drawbacks

Adds public entrypoints and entity-specific helpers that must stay aligned with the Commerce Admin UI contract.

## Rationale and alternatives

Entity-specific helpers mirror the existing order, invoice, and credit memo APIs and avoid breaking consumers. Generic public button helpers would require a broader API redesign.

Naming the config key `returns` or `return` was considered; `rma` matches the Commerce module and the entity token Commerce uses for per-button ACL resources.

## Unresolved questions

Commerce must support this extension point before the configured buttons can render.

## Future possibilities

Add return grid columns or mass actions if Commerce exposes them on the returns grid.
