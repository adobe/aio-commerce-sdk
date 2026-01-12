---
"@adobe/aio-commerce-lib-events": minor
"@aio-commerce-sdk/common-utils": patch
---

Refactor library to extract common code out to a shared private package.

Changes:

- Moved common utility functions to `@aio-commerce-sdk/common-utils` package.
- Updated `@adobe/aio-commerce-lib-events` to use the common utils package.
