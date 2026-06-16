# Mass Actions (`commerce/backend-ui/2`)

Adds a bulk action to the order, product, or customer grid, applied to the records the user selects.
Declared under `adminUi.<entity>.massActions` (an array). Two variants, discriminated by `type`:

- **`worker`** — Commerce calls a runtime action with the selected ids (server-side processing).
- **`view`** — Commerce opens an iframe into the app's `web-src` at `path`, passing the selection as a query parameter.

## Config (`app.commerce.config.ts`)

```ts
adminUi: {
  customer: {
    massActions: [
      // worker — server-side bulk processing
      {
        type: "worker",
        id: "archive-customers",
        label: "Archive",
        description: "Archive the selected customers.",
        runtimeAction: "my-app/archive-customers",
        timeout: 60,         // optional, seconds
        selectionLimit: 500, // optional, max selectable records
        confirm: { title: "Archive?", message: "This archives the selected customers." }, // optional
        notifications: { success: "Customers archived.", error: "Archive failed." },        // optional
      },
      // view — iframe UI that receives the selection
      {
        type: "view",
        id: "export-customers",
        label: "Export",
        path: "#/export-customers",              // route into web-src
        sandboxPermissions: ["allow-downloads"], // optional
        selectionLimit: 100,                     // optional
      },
    ],
  },
}
```

### Constraints

| Field                | Applies to | Constraint                                                                 |
| -------------------- | ---------- | -------------------------------------------------------------------------- |
| `type`               | both       | `"worker"` or `"view"` (strict — keys from the other variant are rejected) |
| `id`                 | both       | Required, non-empty                                                        |
| `label`              | both       | Required, non-empty                                                        |
| `description`        | both       | Optional, non-empty                                                        |
| `title`              | both       | Optional page title                                                        |
| `confirm`            | both       | Optional `{ title?, message? }`                                            |
| `notifications`      | both       | Optional `{ success?, error? }`                                            |
| `selectionLimit`     | both       | Optional positive number — max selectable records                          |
| `runtimeAction`      | worker     | Required; `<package>/<action>`                                             |
| `timeout`            | worker     | Optional positive number (seconds)                                         |
| `path`               | view       | Required; route into `web-src`                                             |
| `sandboxPermissions` | view       | Optional; `allow-downloads` / `allow-modals` / `allow-popups`              |

Available on `order`, `product`, and `customer`.

## Worker handler wire contract

Import from `@adobe/aio-commerce-sdk/admin-ui/mass-actions`.

Commerce POSTs `{ requestId, gridType, ids }` (`ids` is non-empty). The HTTP status code conveys success vs. failure.

- `parseMassActionRequest(params)` → `{ requestId, gridType, ids }`; throws `CommerceSdkValidationError` on malformed input.
- `okMassActionResponse(body?)` → HTTP 200; optional body for logging.
- `massActionErrorResponse(statusCode, message)` → non-2xx; body is `{ message }`. Commerce surfaces `notifications.error`.

```typescript
import {
  parseMassActionRequest,
  okMassActionResponse,
  massActionErrorResponse,
} from "@adobe/aio-commerce-sdk/admin-ui/mass-actions";

export async function main(params: unknown) {
  const { gridType, ids } = parseMassActionRequest(params);
  try {
    const archived = await archive(gridType, ids);
    return okMassActionResponse({ archived });
  } catch (error) {
    return massActionErrorResponse(500, (error as Error).message);
  }
}
```

## View variant (iframe)

No server handler. Commerce opens the iframe at `path` and appends the selection as a JSON-encoded `selection` query parameter. Read it inside the iframe with `parseMassActionSelection`:

```typescript
import { parseMassActionSelection } from "@adobe/aio-commerce-sdk/admin-ui/mass-actions";

const raw = new URLSearchParams(window.location.search).get("selection");
const { ids, gridType } = parseMassActionSelection(raw); // ids: string[], gridType: "order" | "product" | "customer"
```
