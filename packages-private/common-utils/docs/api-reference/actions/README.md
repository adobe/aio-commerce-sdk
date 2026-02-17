# `actions`: Module

This module exports core action utilities for the AIO Commerce SDK.

## Classes

| Class                                           | Description                                                                                                             |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [HttpActionRouter](classes/HttpActionRouter.md) | HTTP router for Adobe I/O Runtime actions. Provides type-safe routing with schema validation and OpenWhisk integration. |

## Interfaces

| Interface                                    | Description                                                                                                                         |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [BaseContext](interfaces/BaseContext.md)     | Internal context with raw action params, always available.                                                                          |
| [CompiledRoute](interfaces/CompiledRoute.md) | Internal compiled route representation used by the router.                                                                          |
| [LoggerContext](interfaces/LoggerContext.md) | -                                                                                                                                   |
| [LoggerOptions](interfaces/LoggerOptions.md) | -                                                                                                                                   |
| [RouteContext](interfaces/RouteContext.md)   | Base context interface for route handlers. This interface can be extended via declaration merging to add custom context properties. |
| [RouteRequest](interfaces/RouteRequest.md)   | Represents an incoming route request with typed parameters, body, and query.                                                        |

## Type Aliases

| Type Alias                                       | Description                                                                                                                                                                                          |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ContextBuilder](type-aliases/ContextBuilder.md) | Context builder function type. Receives current context and returns additional context properties (sync or async).                                                                                   |
| [ExtractParams](type-aliases/ExtractParams.md)   | Extracts all route parameters from a path string, including both named parameters and wildcard segments.                                                                                             |
| [RouteConfig](type-aliases/RouteConfig.md)       | Route configuration with type inference from schemas and context. If schemas are provided, they're used for both validation AND type inference. Otherwise, types are inferred from the path pattern. |

## Functions

| Function                                | Description                                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [defineRoute](functions/defineRoute.md) | Define a route handler separately from registration. Pass a router to infer context type from middleware. |
| [logger](functions/logger.md)           | Creates a logger middleware that adds logging capabilities to the context.                                |
