---
"@adobe/aio-commerce-lib-api": minor
---

Add `buildSearchCriteria` and `buildSearchCriteriaRecord` for Commerce REST list endpoints. Describe filters, sorting and pagination as a `SearchCriteria` object and pass the result straight to `searchParams`, instead of assembling the bracketed `searchCriteria[...]` parameters by hand.
