# `error`: Module

This module exports core error utilities for the AIO Commerce SDK.

## Classes

| Class                                                               | Description                                                                                                                                                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CommerceSdkErrorBase](classes/CommerceSdkErrorBase.md)             | Base class for all the errors in the AIO Commerce SDK.                                                                                                                                                  |
| [CommerceSdkValidationError](classes/CommerceSdkValidationError.md) | Represents a validation error in the Commerce SDK. This error should be thrown when an input does not conform to the expected schema. It contains a list of issues that describe the validation errors. |

## Type Aliases

| Type Alias                                                                 | Description                                                                           |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [CommerceSdkErrorBaseOptions](type-aliases/CommerceSdkErrorBaseOptions.md) | Defines the base options for [CommerceSdkErrorBase](classes/CommerceSdkErrorBase.md). |
| [CommerceSdkErrorOptions](type-aliases/CommerceSdkErrorOptions.md)         | Helper type to define custom error options.                                           |
