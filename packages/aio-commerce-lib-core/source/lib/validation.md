# API Documentation

## packages/aio-commerce-lib-core/source/lib/validation.ts

### Classs

#### `CommerceSdkValidationError`

Represents a validation error in the Commerce SDK.
This error is thrown when the input does not conform to the expected schema.
It contains a list of issues that describe the validation errors.

**Examples:**

````javascript
```ts
const error = new CommerceSdkValidationError("Invalid input", {
issues: [
{ kind: "validation", message: "Expected a non-empty string", path: "name" },
],
});

console.log(error.display());
````

````

**Location:** `packages/aio-commerce-lib-core/source/lib/validation.ts:116`


---

### Functions

#### `issueToDisplay`

Converts validation issues to a formatted display string.

**Parameters:**

- `issues` - Array of validation issues to format.

**Returns:** A formatted string representation of the issues.

**Examples:**

```javascript
```typescript
const issues = [
{ kind: "validation", message: "Expected a string", path: ["name"] },
{ kind: "schema", message: "Missing required field", path: ["email"] }
];
const display = issueToDisplay(issues);
console.log(display);
// ├── Input error at name → Expected a string
// └── Schema validation error at email → Missing required field
````

````

**Location:** `packages/aio-commerce-lib-core/source/lib/validation.ts:50`


---

#### `displayValidationError`

Prints a validation error to display with the error message and the issues.

**Parameters:**

- `error` - {@link CommerceSdkValidationError} The validation error to summarize.

**Returns:** A pretty-printed string containing the summary of the validation error.

**Examples:**

```javascript
```typescript
const error = new CommerceSdkValidationError("Configuration validation failed", {
issues: [
{ kind: "validation", message: "Expected a non-empty string", path: ["clientId"] },
{ kind: "schema", message: "Missing required field", path: ["clientSecret"] }
]
});

const displayText = displayValidationError(error);
console.log(displayText);
// Configuration validation failed
// ├── Input error at clientId → Expected a non-empty string
// └── Schema validation error at clientSecret → Missing required field
````

````

**Location:** `packages/aio-commerce-lib-core/source/lib/validation.ts:91`


---

### Methods

#### `constructor`

Represents a validation error in the Commerce SDK.
This error is thrown when the input does not conform to the expected schema.
It contains a list of issues that describe the validation errors.

**Examples:**

```javascript
```ts
const error = new CommerceSdkValidationError("Invalid input", {
issues: [
{ kind: "validation", message: "Expected a non-empty string", path: "name" },
],
});

console.log(error.display());
````

````

**Location:** `packages/aio-commerce-lib-core/source/lib/validation.ts:117`


---

#### `display`

/** Returns a pretty string representation of the validation error.

**Location:** `packages/aio-commerce-lib-core/source/lib/validation.ts:128`


---

### Variables

#### `LAST_RETURN_CHAR`

Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.

**Location:** `packages/aio-commerce-lib-core/source/lib/validation.ts:21`


---

#### `RETURN_CHAR`

Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.

**Location:** `packages/aio-commerce-lib-core/source/lib/validation.ts:22`


---

#### `ISSUE_KIND_TO_ERROR_TITLE`

/** Maps issue kinds to their corresponding error titles for display purposes.

**Location:** `packages/aio-commerce-lib-core/source/lib/validation.ts:28`


---

#### `lines`

Converts validation issues to a formatted display string.

**Parameters:**

- `issues` - Array of validation issues to format.

**Returns:** A formatted string representation of the issues.

**Examples:**

```javascript
```typescript
const issues = [
{ kind: "validation", message: "Expected a string", path: ["name"] },
{ kind: "schema", message: "Missing required field", path: ["email"] }
];
const display = issueToDisplay(issues);
console.log(display);
// ├── Input error at name → Expected a string
// └── Schema validation error at email → Missing required field
````

````

**Location:** `packages/aio-commerce-lib-core/source/lib/validation.ts:51`


---

#### `returnChar`

Converts validation issues to a formatted display string.

**Parameters:**

- `issues` - Array of validation issues to format.

**Returns:** A formatted string representation of the issues.

**Examples:**

```javascript
```typescript
const issues = [
{ kind: "validation", message: "Expected a string", path: ["name"] },
{ kind: "schema", message: "Missing required field", path: ["email"] }
];
const display = issueToDisplay(issues);
console.log(display);
// ├── Input error at name → Expected a string
// └── Schema validation error at email → Missing required field
````

````

**Location:** `packages/aio-commerce-lib-core/source/lib/validation.ts:52`


---

#### `kindText`

Converts validation issues to a formatted display string.

**Parameters:**

- `issues` - Array of validation issues to format.

**Returns:** A formatted string representation of the issues.

**Examples:**

```javascript
```typescript
const issues = [
{ kind: "validation", message: "Expected a string", path: ["name"] },
{ kind: "schema", message: "Missing required field", path: ["email"] }
];
const display = issueToDisplay(issues);
console.log(display);
// ├── Input error at name → Expected a string
// └── Schema validation error at email → Missing required field
````

````

**Location:** `packages/aio-commerce-lib-core/source/lib/validation.ts:56`


---

#### `dotPath`

Converts validation issues to a formatted display string.

**Parameters:**

- `issues` - Array of validation issues to format.

**Returns:** A formatted string representation of the issues.

**Examples:**

```javascript
```typescript
const issues = [
{ kind: "validation", message: "Expected a string", path: ["name"] },
{ kind: "schema", message: "Missing required field", path: ["email"] }
];
const display = issueToDisplay(issues);
console.log(display);
// ├── Input error at name → Expected a string
// └── Schema validation error at email → Missing required field
````

````

**Location:** `packages/aio-commerce-lib-core/source/lib/validation.ts:61`


---

#### `path`

Converts validation issues to a formatted display string.

**Parameters:**

- `issues` - Array of validation issues to format.

**Returns:** A formatted string representation of the issues.

**Examples:**

```javascript
```typescript
const issues = [
{ kind: "validation", message: "Expected a string", path: ["name"] },
{ kind: "schema", message: "Missing required field", path: ["email"] }
];
const display = issueToDisplay(issues);
console.log(display);
// ├── Input error at name → Expected a string
// └── Schema validation error at email → Missing required field
````

````

**Location:** `packages/aio-commerce-lib-core/source/lib/validation.ts:62`


---

#### `issueLine`

Converts validation issues to a formatted display string.

**Parameters:**

- `issues` - Array of validation issues to format.

**Returns:** A formatted string representation of the issues.

**Examples:**

```javascript
```typescript
const issues = [
{ kind: "validation", message: "Expected a string", path: ["name"] },
{ kind: "schema", message: "Missing required field", path: ["email"] }
];
const display = issueToDisplay(issues);
console.log(display);
// ├── Input error at name → Expected a string
// └── Schema validation error at email → Missing required field
````

```

**Location:** `packages/aio-commerce-lib-core/source/lib/validation.ts:63`


---

```
