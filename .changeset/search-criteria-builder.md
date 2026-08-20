---
"@adobe/aio-commerce-lib-api": minor
---

Add a search criteria builder for Commerce REST list endpoints. Describe filters, sorting and pagination with `searchCriteria()` or `buildSearchCriteria()` and pass the result straight to `searchParams`, instead of assembling the bracketed `searchCriteria[...]` parameters by hand. Use `filter()` for conditions that must all hold and `filterGroup()` for alternatives.
