# Required business configuration fields

- **Ticket:** [CEXT-7002](https://jira.corp.adobe.com/browse/CEXT-7002)
- **Created:** 2026-11-11
- [x] **Implemented**

## Summary

Allow business configuration fields to declare `requiredFor` operations for scope saves, installation, and upgrade prerequisites.

## Motivation

Apps may need a merchant to provide configuration, such as a service credential, before it can operate. Today the schema cannot express that requirement and a scope update can persist an empty value. Developers need to communicate and enforce the requirement while retaining scope inheritance and partial updates.

Goals: expose the flag for all field types, preserve it through parsing and dynamic list resolution, and validate updated fields before saving. Existing schemas and updates to optional fields must keep their current behavior. Validating every field on every partial update is out of scope.

## Developer experience

```typescript
businessConfig: {
  schema: [
    { name: "apiKey", type: "password", requiredFor: ["save", "installation", "upgrade"] },
    { name: "enabled", type: "boolean", requiredFor: ["save"], default: false },
  ],
}
```

`requiredFor` is an optional array containing any of `"save"`, `"installation"`, and `"upgrade"`. For `"save"`, only fields included in a partial update are validated against their effective value at the selected scope. Empty strings and empty arrays are missing; `false` is valid. A `null` value removes the scope override and is accepted if the resulting inherited value or schema default is non-empty. An explicit empty override is rejected even when a parent has a value. A rejected update saves none of its changes; the configuration API returns HTTP 400 with a validation error.

Before starting an install or upgrade, the app checks all fields marked for that operation that apply to the associated Commerce environment. Each must have a non-empty effective global value; defaults count, `false` is valid, and values set only in other scopes do not count. Missing values cause a 409 `missing-required-configuration` response listing field names. The pending plan can be retried after correcting the values; planning and uninstall are unaffected.

## Design

Add the `requiredFor` values to the shared business field schema, including recorded and dynamically resolved fields, so app configuration parsing and the configuration API expose them. The configuration library computes the effective value after applying the requested scope changes and checks each included save-required field before persisting. Parent values and defaults participate in resolution; password values remain encrypted in storage. The configuration library also checks global values for a lifecycle operation without exposing secrets. The installation action runs this check on start before writing an attempt or dispatching work. The runtime action translates validation failures into a client error. Documentation, OpenAPI, and business configuration skill guidance describe the contract.

## Drawbacks

Save validation adds schema and scope-resolution work to updates containing fields marked with `requiredFor: ["save"]`. Empty values previously accepted for a field become invalid once its developer opts into this operation.

## Rationale and alternatives

Validating only updated fields preserves the existing partial-update contract and avoids blocking unrelated updates when other required values are missing. Allowing inherited values and defaults preserves the existing scope model. Requiring an explicit value on every scope or validating all fields would impose new obligations beyond the requested update.

## Unresolved questions

None for this feature.

## Future possibilities

Extend lifecycle validation to non-global scopes if an application needs scope-specific prerequisites.
