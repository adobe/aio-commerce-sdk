# API Documentation

## packages/aio-commerce-lib-core/source/lib/result.ts

### Functions

#### `ok`

Wraps the given value in a successful result.

**Parameters:**

- `value` - The value to wrap.

**Returns:** A successful result containing the given value.

**Location:** `packages/aio-commerce-lib-core/source/lib/result.ts:46`

---

#### `err`

Wraps the given error in a failed result.

**Parameters:**

- `error` - The error to wrap.

**Returns:** A failed result containing the given error.

**Location:** `packages/aio-commerce-lib-core/source/lib/result.ts:55`

---

#### `unwrap`

Unwraps a result to retrieve its value.
If the result is a failure, an error will be thrown.

**Parameters:**

- `result` - The result to unwrap.

**Returns:** The value contained in the successful result.

**Location:** `packages/aio-commerce-lib-core/source/lib/result.ts:67`

---

#### `unwrapErr`

Unwraps a result to retrieve its error.
If the result is a success, an error will be thrown.

**Parameters:**

- `result` - The result to unwrap.

**Returns:** The error contained in the failed result.

**Location:** `packages/aio-commerce-lib-core/source/lib/result.ts:85`

---

#### `isOk`

Checks if a result is a success.

**Parameters:**

- `result` - The result to check.

**Returns:** True if the result is a success, false otherwise.

**Location:** `packages/aio-commerce-lib-core/source/lib/result.ts:102`

---

#### `isErr`

Checks if a result is a failure.

**Parameters:**

- `result` - The result to check.

**Returns:** True if the result is a failure, false otherwise.

**Location:** `packages/aio-commerce-lib-core/source/lib/result.ts:113`

---

#### `map`

Maps a successful result to another value.
If the result is a failure, it is returned unchanged.

**Parameters:**

- `result` - The result to map.
- `fn` - A function to transform the success value.

**Returns:** A new {@link Result} with the transformed value or the original error.

**Location:** `packages/aio-commerce-lib-core/source/lib/result.ts:127`

---

#### `mapErr`

Maps a failed result's error to another error value.
If the result is a success, it is returned unchanged.

**Parameters:**

- `result` - The result to map.
- `fn` - A function to transform the error value.

**Returns:** A new Result with the original value or transformed error.

**Location:** `packages/aio-commerce-lib-core/source/lib/result.ts:146`

---

### Variables

#### `SuccessOrFailure`

Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.

**Location:** `packages/aio-commerce-lib-core/source/lib/result.ts:13`

---
