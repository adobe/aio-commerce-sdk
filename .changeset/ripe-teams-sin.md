---
"@adobe/aio-commerce-lib-auth": patch
---

Fixed an issue where the `resolve` utilities where asserting that the input was correct, which is expected, but they were not returning the output data of transformations applied during schema parsing, which caused some inputs to always be invalid, as the `params` objectonly handles primitives.
