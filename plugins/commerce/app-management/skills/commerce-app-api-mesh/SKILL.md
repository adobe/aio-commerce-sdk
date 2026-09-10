---
name: commerce-app-api-mesh
description: >
  Scaffold or update an Adobe API Mesh configuration (mesh.json) in front of
  a Commerce app: add GraphQL/OpenAPI sources, extend an existing Commerce
  GraphQL type with a new field, and wire a cross-source resolver for it.
  Use when the user mentions API Mesh, mesh.json, extending a Commerce
  GraphQL type (e.g. adding a field to Order/CustomerOrder/Product), or
  stitching a runtime action's data into the storefront's GraphQL schema.
license: Apache-2.0
compatibility: >
  Requires the api-mesh CLI plugin (aio plugins install
  @adobe/aio-cli-plugin-api-mesh). If wrapping a runtime action as a source,
  that action must already be built and deployed.
metadata:
  author: adobe
---

# Wire API Mesh in Front of a Commerce App

Composes Commerce's own GraphQL API and this app's runtime actions into a single mesh schema. Two moves this skill covers: exposing a runtime action as a mesh source, and extending an existing Commerce type with a field resolved by delegating to that source.

This skill assumes general API Mesh knowledge (`mesh.json` anatomy, handler types, transforms, hooks, secrets, CORS, generic declarative/programmatic resolvers). If any of that is unfamiliar, load it from Adobe's own material first — see [References](#references) — rather than guessing at syntax. None of that material covers extending an existing Commerce type via `additionalResolvers` (`targetTypeName`/`sourceTypeName`/`requiredSelectionSet`/`sourceSelectionSet`) or wrapping an aio-commerce-sdk runtime action as a mesh source — that's what follows.

## Prerequisites

- `aio plugins install @adobe/aio-cli-plugin-api-mesh` is installed.
- If exposing a runtime action as a source, it's already built and deployed with a real, reachable HTTPS endpoint — a source pointing at an undeployed action fails opaquely.
- Check whether a mesh already exists for this workspace: `aio api-mesh:get`. "No mesh found" → you'll `create`; otherwise you're editing an existing `mesh.json` and will `update`.

## Step 1 — Confirm schema shapes via introspection

Before writing `additionalTypeDefs` or `additionalResolvers`, introspect the Commerce (or other) GraphQL source you're extending. Don't assume a type/field name from memory or a similar-sounding convention — near-miss names produce a mesh that builds successfully but whose resolver never fires.

```bash
curl -s -X POST "<graphql-endpoint>" -H "Content-Type: application/json" \
  -d '{"query":"{ __type(name: \"<TargetType>\") { fields { name } } }"}'
```

## Step 2 — Scaffold sources

```json
{
  "name": "Commerce",
  "handler": {
    "graphql": {
      "endpoint": "<commerce-graphql-endpoint>",
      "operationHeaders": { "Authorization": "{context.headers.authorization}" }
    }
  }
}
```

Include `operationHeaders` by default on any source whose schema has customer-, cart-, or session-scoped fields — API Mesh does **not** forward the caller's `Authorization` header automatically. Omitting it makes every authenticated query fail with the backend's own generic "not authorized" error, indistinguishable from an invalid token.

To wrap a runtime action, write a small static OpenAPI document describing just its endpoint and reference it by relative path:

```json
{
  "name": "<SourceName>",
  "handler": { "openapi": { "source": "./mesh/<source>.json" } }
}
```

The declared response schema must match what the action actually returns — the mesh parses according to what you declare, it doesn't reshape data.

## Step 3 — Extend a type and wire the resolver

```json
"additionalTypeDefs": "extend type <TargetType> { <newField>: String }",
"additionalResolvers": [
  {
    "targetTypeName": "<TargetType>",
    "targetFieldName": "<newField>",
    "sourceName": "<SourceName>",
    "sourceTypeName": "Query",
    "sourceFieldName": "<sourceField>",
    "requiredSelectionSet": "{ <keyField> }",
    "sourceArgs": { "<arg>": "{root.<keyField>}" },
    "sourceSelectionSet": "{ <resultField> }",
    "result": "<resultField>"
  }
]
```

Always pair `sourceSelectionSet` with `result` when extracting a scalar from an object-returning source field — never use `result` alone. The `result`-only path builds its selection set by hand instead of via the GraphQL parser, and breaks with `"No type was found for field node ... __typename"` specifically when the target field resolves inside a list (e.g. a parent's `items[].<newField>`). A direct root-query call to the same source field succeeds even when this bug is present, so that test alone isn't sufficient proof the resolver works.

## Step 4 — Deploy and verify

```sh
aio api-mesh:create mesh.json -c   # first time
aio api-mesh:update mesh.json -c   # subsequent edits
```

Provisioning is asynchronous — poll rather than assume completion:

```sh
until aio api-mesh:status 2>&1 | grep -qi success; do sleep 20; done
```

Verify in two tiers: first the source's root field directly, then the field in its real nested/authenticated shape (a list-nested query with a real caller credential, not a flat root-field call). Tier 1 passing does not prove tier 2 works — the bug above is invisible in tier 1.

## Common Issues

- **`"not authorized"` on an authenticated query, even with a valid token** — the source's `graphql` handler is missing `operationHeaders`. Check `mesh.json`, not the token.
- **`"No type was found for field node ... __typename"` on a nested/list field, but the source works fine at root** — the resolver uses `result` without `sourceSelectionSet`. Add it.

## Quality Bar

- `aio api-mesh:status` reports success, and the new field resolves correctly in its real nested/authenticated shape, not just at the source's root field.

## Chaining

- **The source doesn't exist yet as a runtime action** — invoke `commerce-app-storage`, `commerce-app-webhooks`, or `commerce-app-eventing` to scaffold and deploy it first.

## References

- [API Mesh prompting guide](https://developer.adobe.com/graphql-mesh-gateway/mesh/basic/prompting) — Adobe's own guidance for prompting an agent to write mesh configs; general workflow and expectations
- [api-mesh-starter-kit llm.txt](https://raw.githubusercontent.com/adobe-commerce/api-mesh-starter-kit/refs/heads/main/llm.txt) — reference knowledge base covering `mesh.json` anatomy, all three handler types, transforms, hooks, secrets, context state, CORS, and the CLI command set
