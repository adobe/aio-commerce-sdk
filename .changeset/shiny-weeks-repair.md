---
"@adobe/aio-commerce-lib-app": major
"@adobe/aio-commerce-sdk": major
---

Remove `commerce/backend-ui/1` support and the `adminUiSdk` config key. Migrate to `adminUi` and `commerce/backend-ui/2`.

**Migration:** Replace `adminUiSdk` in your `app.commerce.config.*` with the `adminUi` config key. See the updated `usage.md` for the new shape. The generated `src/commerce-backend-ui-1/` directory and its `pre-app-build` hook can be removed from your project.
