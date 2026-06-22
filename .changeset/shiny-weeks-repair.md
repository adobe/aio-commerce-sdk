---
"@adobe/aio-commerce-lib-app": minor
"@adobe/aio-commerce-sdk": minor
---

> [!NOTE]
> This is not causing a major bump because the `adminUiSdk` property was in an experimental phase, which wasn't stabilized yet. A manual migration is still needed.

Remove `commerce/backend-ui/1` support and the `adminUiSdk` config key. Migrate to `adminUi` and `commerce/backend-ui/2`.

**Migration:** Replace `adminUiSdk` in your `app.commerce.config.*` with the `adminUi` config key. See the updated `usage.md` for the new shape. The generated `src/commerce-backend-ui-1/` directory and its `pre-app-build` hook can be removed from your project.
