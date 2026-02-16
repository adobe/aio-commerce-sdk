# `params`: Module

This module exports core parameter utilities for the AIO Commerce SDK.

## Type Aliases

| Type Alias                                                 | Description                                                                                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| [HttpMethod](type-aliases/HttpMethod.md)                   | Standard HTTP methods supported by Adobe I/O Runtime. These are the methods that can be used when invoking runtime actions via HTTP. |
| [HttpMethodLowercase](type-aliases/HttpMethodLowercase.md) | Lowercase HTTP method as sent by OpenWhisk/Adobe I/O Runtime. OpenWhisk sends methods in lowercase (e.g., "get", "post").            |
| [RuntimeActionParams](type-aliases/RuntimeActionParams.md) | The type of the runtime action parameters.                                                                                           |

## Functions

| Function                                | Description                                                  |
| --------------------------------------- | ------------------------------------------------------------ |
| [allNonEmpty](functions/allNonEmpty.md) | Checks if all required parameters are non-empty.             |
| [nonEmpty](functions/nonEmpty.md)       | Checks if the given runtime action input value is non-empty. |
