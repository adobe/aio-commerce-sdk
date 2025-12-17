# `operations`: Module

## Type Aliases

| Type Alias                                                           | Description                                                                                                             |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [AddOperation](type-aliases/AddOperation.md)                         | Add operation response Causes Commerce to add the provided value to the provided path in the triggered event arguments. |
| [ExceptionOperation](type-aliases/ExceptionOperation.md)             | Exception operation response Causes Commerce to terminate the process that triggered the original event.                |
| [RemoveOperation](type-aliases/RemoveOperation.md)                   | Remove operation response Causes Commerce to remove a value or node in triggered event arguments by the provided path.  |
| [ReplaceOperation](type-aliases/ReplaceOperation.md)                 | Replace operation response Causes Commerce to replace a value in triggered event arguments for the provided path.       |
| [SuccessOperation](type-aliases/SuccessOperation.md)                 | Success operation response The process that triggered the original event continues without any changes.                 |
| [WebhookOperation](type-aliases/WebhookOperation.md)                 | Webhook operation types supported by Adobe Commerce                                                                     |
| [WebhookOperationResponse](type-aliases/WebhookOperationResponse.md) | Union type representing any webhook operation response                                                                  |
| [WebhookResponse](type-aliases/WebhookResponse.md)                   | Webhook response can be a single operation or an array of operations                                                    |
| [WebhookResponseBase](type-aliases/WebhookResponseBase.md)           | Base webhook response structure                                                                                         |

## Functions

| Function                                                        | Description                                                                                                                                                                                                         |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [addOperation](functions/addOperation.md)                       | Creates an add operation response Causes Commerce to add the provided value to the provided path in the triggered event arguments. See [buildAddOperation](functions/buildAddOperation.md) for details.             |
| [buildAddOperation](functions/buildAddOperation.md)             | biome-ignore-all lint/performance/noBarrelFile: This is the public API for the webhook operations entrypoint                                                                                                        |
| [buildExceptionOperation](functions/buildExceptionOperation.md) | biome-ignore-all lint/performance/noBarrelFile: This is the public API for the webhook operations entrypoint                                                                                                        |
| [buildRemoveOperation](functions/buildRemoveOperation.md)       | biome-ignore-all lint/performance/noBarrelFile: This is the public API for the webhook operations entrypoint                                                                                                        |
| [buildReplaceOperation](functions/buildReplaceOperation.md)     | biome-ignore-all lint/performance/noBarrelFile: This is the public API for the webhook operations entrypoint                                                                                                        |
| [buildSuccessOperation](functions/buildSuccessOperation.md)     | biome-ignore-all lint/performance/noBarrelFile: This is the public API for the webhook operations entrypoint                                                                                                        |
| [exceptionOperation](functions/exceptionOperation.md)           | Creates an exception operation response with a message Causes Commerce to terminate the process that triggered the original event. See [buildExceptionOperation](functions/buildExceptionOperation.md) for details. |
| [removeOperation](functions/removeOperation.md)                 | Creates a remove operation response Causes Commerce to remove a value or node in triggered event arguments by the provided path. See [buildRemoveOperation](functions/buildRemoveOperation.md) for details.         |
| [replaceOperation](functions/replaceOperation.md)               | Creates a replace operation response Causes Commerce to replace a value in triggered event arguments for the provided path. See [buildReplaceOperation](functions/buildReplaceOperation.md) for details.            |
| [successOperation](functions/successOperation.md)               | Creates a success operation response The process that triggered the original event continues without any changes. See [buildSuccessOperation](functions/buildSuccessOperation.md) for details.                      |
