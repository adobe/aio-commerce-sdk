---
"@adobe/aio-commerce-lib-app": patch
---

The app build hooks now set `NODE_ENV` in the project `.env` so the web bundler builds for the correct environment (production on build, development on dev and run).
