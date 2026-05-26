# App Icon Support

- **Ticket:** [CEXT-6231](https://jira.corp.adobe.com/browse/CEXT-6231)
- **Created:** 2026-05-21
- [ ] **Implemented**

## Summary

Add an `icon` field to `app.commerce.config.ts` so Commerce app developers can
declare an icon for their app. The value is a relative path to a local image
file; the `pre-app-build` hook validates it and adds it to the action's
`include` list in the generated `ext.config.yaml`, so App Builder deploys it
as a file alongside the action code. The `app-config` action exposes a public
`/app-config/icon` endpoint that reads and serves the file as binary. The
`app-config` response includes an `iconUrl` pointing to that endpoint, making
the icon appear in Commerce App Management for all distribution models. For
Exchange-listed apps that also declare an icon in their config, the
SDK-declared icon takes precedence over the icon sourced from App Registry.

## Motivation

Icons currently appear only for apps distributed through Adobe Exchange. Those
apps go through the Developer Distribution Portal, where the listing (including
icon) is reviewed, approved, and published to App Registry. Commerce App
Management reads `app.icon` from the App Registry entry during association.

Apps deployed directly by a developer via `aio app deploy` have no Exchange
listing and therefore no entry in App Registry with an icon. These apps always
show a 32×32 px gray placeholder, regardless of what the developer intended.

The root cause is that the SDK offers no supported path to provide an icon. The
`MetadataSchema` has `displayName`, `description`, `version`, and `id` — but no
`icon` field. This is the primary gap.

Commerce App Management does expose an icon field through the "Publish your app" flow available in
the production workspace. However, this path has significant restrictions: it is limited to the
production workspace — no equivalent exists for staging or development workspaces; for
non-downloadable apps, the icon field is not editable through this flow and is currently broken (the
app shows a generic puzzle-piece placeholder instead of the icon submitted via Exchange); and it ties
icon management to the publication lifecycle rather than the deploy cycle. For downloadable apps
published directly in the production workspace the flow does work, but it does not cover the general
case.

**Goals:**

- Give developers a first-class, config-level way to declare an app icon that
  works across all distribution models.
- Keep the `app-config` response payload lean so that Extension Manager
  aggregate responses (which include all apps for an org) do not inflate with
  per-app icon data. Only a small `iconUrl` string is stored per app.
- Ensure the icon can be rendered inside Adobe Unified Shell without violating
  the `img-src` Content Security Policy.

**Non-goals:**

- Supporting arbitrary external image hosting. The `icon` field accepts only a
  relative path to a local file; the SDK deploys it at build time. Arbitrary
  external URLs cannot be deployed by the SDK and introduce URL rot risk — the
  icon would silently break if the external host goes offline.
- Icon resizing. Only PNG and JPG files under 1 MB and exactly 48×48 px are
  accepted, consistent with the minimum Adobe Exchange listing requirement.
- Icon management outside of the deploy cycle (e.g. updating an icon without
  redeploying the app).

## Developer experience

A developer adds an `icon` field under `metadata` in `app.commerce.config.ts`:

```typescript
import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

export default defineConfig({
  metadata: {
    id: "my-commerce-app",
    displayName: "My Commerce App",
    description: "Extends Commerce checkout with fraud scoring.",
    version: "1.0.0",
    icon: "assets/icon.png",
  },
});
```

The value is a path relative to the `app.commerce.config` file. The `pre-app-build` hook
reads the file, validates it, and adds it to the `include` list of the
`app-config` action in the generated `ext.config.yaml`. App Builder deploys it
as a file alongside the action code. The `app-config` response includes an
`iconUrl` as part of every request:

```json
{
  "metadata": {
    "id": "my-commerce-app",
    "displayName": "My Commerce App",
    "iconUrl": "https://{namespace}.adobeioruntime.net/api/v1/web/app-management/app-config/icon?v=a1b2c3d4"
  }
}
```

Commerce App Management renders the icon directly from the URL during
association. The icon appears for anyone who installs or views the app.

**Validation errors**

If the path is invalid, schema validation fails before deployment begins:

```
✖ metadata.icon: must be a relative path to a PNG or JPG file (e.g. "assets/icon.png").
  Received: "https://example.com/icon.png"
```

```
✖ metadata.icon: must be a relative path to a PNG or JPG file (e.g. "assets/icon.png").
  Received: "/assets/icon.png"
```

```
✖ metadata.icon: must be a relative path to a PNG or JPG file (e.g. "assets/icon.png").
  Received: "assets/icon.svg"
```

If the file does not exist on disk, exceeds 1 MB, or has wrong dimensions, the
pre-build hook fails before the build begins:

```
✖ metadata.icon: file not found: "assets/icon.png"
```

```
✖ metadata.icon: icon file must be smaller than 1 MB (actual: 1.4 MB).
```

```
✖ metadata.icon: icon must be 48×48 px (actual: 32×20 px).
```

## Design

### Schema change

`MetadataSchema` in
`packages/aio-commerce-lib-app/source/config/schema/metadata.ts` gains a new
optional field:

```typescript
icon: v.optional(
  v.pipe(
    v.string(),
    v.regex(
      /^(?!https?:\/\/|\/)\S+\.(?:png|jpe?g)$/i,
      'must be a relative path to a PNG or JPG file (e.g. "assets/icon.png")',
    ),
  ),
);
```

The regex rejects values that start with `http://`, `https://`, or `/`, and
requires the path to end with `.png`, `.jpg`, or `.jpeg` (case-insensitive),
consistent with the formats accepted by Adobe Exchange listings.

### Pre-build validation

The `pre-app-build` hook already reads `app.commerce.config.ts` to generate
`ext.config.yaml`. When `metadata.icon` is set, the hook additionally:

1. Resolves the path relative to the project root
2. Checks the file exists — fails with a clear error if not
3. Checks the file size is ≤ 1 MB — fails with a clear error if not
4. Reads the image dimensions using the `image-size` package (reads only the
   file header, supports PNG and JPEG) and checks they are exactly 48×48 px —
   fails with a clear error if not
5. Adds the icon file to the `include` list of the `app-config` action in the
   generated `ext.config.yaml`, so App Builder deploys it as a file alongside
   the action code:

```yaml
actions:
  app-config:
    function: actions/app-config/index.js
    include:
      - ["assets/icon.png", "assets/icon.png"]
    web: "yes"
```

6. Computes a short content hash of the icon file (first 8 hex characters of
   its SHA-256 digest) and stores it at a well-known path alongside the icon,
   so the action can read it at startup to construct the versioned `iconUrl`.

This runs before any build or deploy step, giving the developer immediate
feedback without wasting a full build cycle. The icon is fully self-contained
in the deployed action — no CDN or external dependency at runtime.

### Icon endpoint

The icon file is deployed alongside the `app-config` action code via the
`include` mechanism in `ext.config.yaml`. At request time, the action reads it
from the filesystem using the `fs` module and returns the binary content.

The `app-config` action exposes a new public `GET /icon` route (path:
`/app-config/icon`) that returns the binary image with the appropriate
`Content-Type` (`image/png` or `image/jpeg`) and
`Cache-Control: public, max-age=31536000, immutable`. The route is a public web
action — no auth is required, as icons are not sensitive, and `<img src>`
cannot send authentication headers. The endpoint ignores any query parameters
and serves the binary unconditionally.

The `app-config` response includes an `iconUrl` field whose value is the
fully-qualified URL of this endpoint with a content hash appended:

```
https://{__OW_NAMESPACE}.adobeioruntime.net/api/v1/web/app-management/app-config/icon?v={hash}
```

The action reads the hash stored by `pre-app-build` at startup and appends it
as `?v={hash}` when constructing `iconUrl`. The hash and the deployment
namespace are the only inputs needed to construct it.

`Cache-Control: public, max-age=31536000, immutable` — the URL includes a
content hash, so it changes whenever the icon changes. `immutable` is correct:
the response at a given versioned URL will never change. A redeployed icon gets
a new hash, a new URL, and is fetched fresh immediately — no stale period.

### Commerce App Management

Commerce App Management renders the icon directly from `iconUrl`:

```html
<img src="{iconUrl}" />
```

This requires `*.adobeioruntime.net` to be present in the `img-src` directive
of the Commerce App Management SPA CSP configuration in the Adobe Experience
Cloud Developer Portal. Commerce App Management already has
`*.adobeioruntime.net` in `connect-src`; adding it to `img-src` is a one-time
configuration change with no code impact.

The association flow's icon precedence logic does need to be adjusted. The
app's `AppConfig` (fetched from `app-config`) is already available at
association time, making `iconUrl` a natural insertion point. `app-config`
should become the authoritative source, with the existing `app.icon` field from
App Registry (populated only for Exchange-listed apps) as a fallback for apps
that have an Exchange listing but have not yet declared an icon in their config.

### Edge cases

- **Icon field absent** — no `iconUrl` in the `app-config` response; App
  Management renders the existing gray placeholder.
- **App redeployed with a different icon** — the new file is deployed with a
  new content hash. The `app-config` response immediately returns the updated
  `iconUrl` (new `?v=` param). Browsers that cached the previous URL will never
  request it again; they fetch the new URL fresh.

## Drawbacks

- Changing the icon requires a full redeployment; the icon file is deployed at
  build time and does not take effect until the action is redeployed.
- Commerce App Management requires a one-time CSP configuration update to add
  `*.adobeioruntime.net` to its `img-src` directive in the Developer Portal.

## Rationale and alternatives

**Why not the workspace "Publish your app" flow?**
Commerce App Management exposes an icon field through the "Publish your app" flow in the production
workspace. This was considered but is insufficient: it is restricted to the production workspace —
icons set through this path do not apply to staging or development workspaces; the icon field is not
editable for non-downloadable apps and is currently broken for those apps; and it ties icon
management to publication state rather than the deploy cycle, making it inaccessible during
development and testing. The SDK approach works for any workspace status and any distribution model.

**Why relative paths only?**
Relative paths ensure the SDK can resolve and deploy the file at build time.
Arbitrary external URLs cannot be deployed by the SDK and introduce URL rot
risk — external image hosts can go offline without warning, causing the icon to
silently break in production.

**Why not embed the icon in the action code?**
Encoding the icon as base64 and bundling it into the action's JavaScript is the
simplest build-time option, but it conflates code and assets. Binary assets
should not be embedded in action code — the `include` mechanism is the
supported App Builder path for deploying files alongside an action, and it
keeps the action bundle lean and the icon in its natural binary form.

**Why not base64 embedded in the app-config response?**
Extension Manager persists the full `app-config` payload per associated app.
When listing all apps for an org, Extension Manager returns all persisted
payloads in aggregate. At scale — e.g. 100 apps each carrying ~5 KB of base64
icon data — a single list response would carry ~500 KB of icon data, most of
which the UI does not need until the user views a specific app. Storing only an
`iconUrl` string per app keeps Extension Manager payloads lean and independent
of icon size.

**Why not CDN?**
App Builder only deploys files from `web-src` to the CDN (`adobeio-static.net`).
Apps without web assets (headless runtime-action-only apps) cannot push files
to the CDN. There is no supported mechanism to work around this — adding a
minimal `web-src` folder only to enable CDN uploads, or copying files into the
build output via a post-build hook, are unsupported hacks that the SDK cannot
impose on developers.

**Impact of not doing this:**
Directly-deployed apps have no supported path to provide an icon and will
permanently show a gray placeholder in App Management. Only Exchange-listed apps
can display an icon, through the Developer Distribution Portal listing flow.

## Unresolved questions

N/A

## Future possibilities

- Support for a `dark` icon variant (for dark-mode UIs) declared alongside the
  primary icon in `metadata`.
- If App Builder adds native support for deploying static files to the CDN
  without requiring `web-src` (e.g. a dedicated asset upload path in
  `aio app deploy`), the `/app-config/icon` runtime action could be replaced
  with a stable CDN URL. This would eliminate the runtime action invocation
  entirely and remove the need for the Commerce App Management CSP update.
