# App Icon Support

- **Ticket:** [CEXT-6231](https://jira.corp.adobe.com/browse/CEXT-6231)
- **Created:** 2026-05-21
- [ ] **Implemented**

## Summary

Add an `icon` field to `app.commerce.config.ts` so Commerce app developers can
declare an icon for their app. The value is a relative path to a local image
file; the `pre-app-build` hook encodes it to a base64 data URL at build time,
which the `app-config` runtime action returns on every request, making the icon
appear in Commerce App Management for all distribution models.

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

**Goals:**

- Give developers a first-class, config-level way to declare an app icon that
  works across all distribution models.
- Ensure the icon is returned as a base64 data URL so it passes the `data:`
  allowlist in Adobe Unified Shell's `img-src` Content Security Policy.
- Minimise changes to Commerce App Management — no rendering changes are
  required; only the icon source precedence in the association flow needs to be
  adjusted.

**Non-goals:**

- Supporting arbitrary external image hosting. The `icon` field accepts only a
  relative path to a local file; the SDK encodes it at build time. Arbitrary
  external URLs cannot be encoded by the SDK and introduce URL rot risk — the
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

The value is a path relative to the project root. The `pre-app-build` hook
reads the file, validates it, and encodes it to a base64 data URL at build time.
The encoded value is bundled into the `app-config` action and returned as part
of the config response on every request:

```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmH...
```

Commerce App Management picks up the data URL during association and renders it
directly as an image. The icon appears for anyone who installs or views the app.

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
5. Encodes the file as a base64 data URL (`data:image/png;base64,...` or
   `data:image/jpeg;base64,...`). The encoded value is written to a well-known
   path and bundled into the `app-config` action at build time.

This runs before any build or deploy step, giving the developer immediate
feedback without wasting a full build cycle. The icon is fully self-contained
in the deployed action — no CDN or external dependency at runtime.

### Base64 encoding

The `pre-app-build` hook encodes the icon file to a base64 data URL and writes
it to a well-known path that is bundled into the `app-config` action at build
time. At request time, the action returns the pre-computed data URL directly —
no `__OW_NAMESPACE` resolution, no CDN dependency, no external network call.

The `data:` protocol is explicitly listed in Adobe Unified Shell's `img-src`
Content Security Policy (verified from the live response headers at
`experience.adobe.com`), making this the safe and verified delivery mechanism
for app icons.

### Commerce App Management

No rendering changes required. Commerce App Management already handles
URL-based icons end-to-end; `data:` URLs are valid image sources natively
supported by the browser and explicitly allowed by the `img-src` CSP. This spec
only adds the missing input (the developer-declared icon) and the encoding step
in `pre-app-build`.

The association flow's icon precedence logic does need to be adjusted. The
app's `AppConfig` (fetched from `app-config`) is already available at
association time, making `metadata.icon` a natural insertion point.
`app-config` should become the authoritative source, with the existing
`app.icon` field from App Registry (populated only for Exchange-listed apps)
as a fallback for apps that have an Exchange listing but have not yet declared
an icon in their config.

### Edge cases

- **Icon field absent** — no change in behaviour; App Management renders the
  existing gray placeholder.
- **App redeployed with a different icon** — the new base64 value is bundled
  into the action at build time; it takes effect on the next `app-config`
  request after redeployment.

## Drawbacks

- Changing the icon requires a full redeployment; the new base64 value is
  bundled at build time and does not take effect until the action is redeployed.
- Every `app-config` response carries the encoded icon (~3–7 KB for a 48×48
  PNG). `app-config` is called during association rather than on every page
  view, so the overhead is bounded and acceptable in practice.

## Rationale and alternatives

**Why relative paths only?**
Relative paths ensure the SDK can read and encode the file at build time.
Arbitrary external URLs cannot be encoded by the SDK and introduce URL rot risk
— external image hosts can go offline without warning, causing the icon to
silently break in production.

**Why not CDN?**
The App Builder CDN (`adobeio-static.net`) was the original design but was ruled
out by two independent blockers:

1. App Builder only deploys files from `web-src` to the CDN. Apps without web
   assets (headless runtime-action-only apps) cannot push files to the CDN.
   There is no supported mechanism to work around this — adding a minimal
   `web-src` folder only to enable CDN uploads, or copying files into the build
   output via a post-build hook, are unsupported hacks that the SDK cannot
   impose on developers.

2. `adobeio-static.net` is not in Unified Shell's `img-src` CSP. Verified from
   the live `Content-Security-Policy` header at `experience.adobe.com`
   (2026-05-22): `adobeio-static.net` appears only in `frame-src`, not in
   `img-src`. An `<img>` tag pointing to the App Builder CDN would be silently
   blocked by the browser. The `data:` protocol is explicitly listed in
   `img-src`, making base64 the correct and verified choice.

**Why not a dedicated icon endpoint?**
A `GET /app-config/icon` route on the `app-config` action was considered. Two
variants were evaluated:

- **Returns base64 string** — identical to embedding the value in the
  `app-config` response: same payload size, same data, but with an extra network
  round trip and an extra endpoint to maintain. No benefit.
- **Returns binary image with caching headers** — the browser could cache the
  icon independently of `app-config`, keeping `app-config` responses lean.
  However, `adobeioruntime.net` is not in Unified Shell's `img-src` CSP, so the
  URL cannot be used directly as `<img src>`. Commerce App Management would need
  to fetch the icon with an IMS token, convert it to a blob URL, and use that
  instead — significant client complexity for a call path (`app-config` is
  called during association, not on every page view) where the 3–7 KB overhead
  is already bounded and acceptable. If `app-config` ever becomes a higher-
  frequency call, revisiting a cached binary endpoint would be worthwhile.

**Impact of not doing this:**
Directly-deployed apps have no supported path to provide an icon and will
permanently show a gray placeholder in App Management. Only Exchange-listed apps
can display an icon, through the Developer Distribution Portal listing flow.

## Unresolved questions

N/A

## Future possibilities

- Support for a `dark` icon variant (for dark-mode UIs) declared alongside the
  primary icon in `metadata`.
