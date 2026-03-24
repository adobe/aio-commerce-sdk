# `responses`: Module

## Type Aliases

| Type Alias                                                           | Description                                                                                                             |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [AddOperation](type-aliases/AddOperation.md)                         | Add operation response Causes Commerce to add the provided value to the provided path in the triggered event arguments. |
| [ExceptionOperation](type-aliases/ExceptionOperation.md)             | Exception operation response Causes Commerce to terminate the process that triggered the original event.                |
| [RemoveOperation](type-aliases/RemoveOperation.md)                   | Remove operation response Causes Commerce to remove a value or node in triggered event arguments by the provided path.  |
| [ReplaceOperation](type-aliases/ReplaceOperation.md)                 | Replace operation response Causes Commerce to replace a value in triggered event arguments for the provided path.       |
| [SuccessOperation](type-aliases/SuccessOperation.md)                 | Success operation response The process that triggered the original event continues without any changes.                 |
| [WebhookOperationResponse](type-aliases/WebhookOperationResponse.md) | Union type representing any webhook operation response                                                                  |

## Functions

| Function                                              | Description                                                                                                                                           |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [addOperation](functions/addOperation.md)             | Creates an add operation response Causes Commerce to add the provided value to the provided path in the triggered event arguments.                    |
| [exceptionOperation](functions/exceptionOperation.md) | Creates an exception operation response with a message Causes Commerce to terminate the process that triggered the original event.                    |
| [ok](functions/ok.md)                                 | Creates an HTTP 200 OK response with webhook operation(s) Webhook-optimized version of ok() that automatically wraps operations in the response body. |
| [removeOperation](functions/removeOperation.md)       | Creates a remove operation response Causes Commerce to remove a value or node in triggered event arguments by the provided path.                      |
| [replaceOperation](functions/replaceOperation.md)     | Creates a replace operation response Causes Commerce to replace a value in triggered event arguments for the provided path.                           |
| [successOperation](functions/successOperation.md)     | Creates a success operation response The process that triggered the original event continues without any changes.                                     |
