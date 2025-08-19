/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {
  email,
  maxLength,
  minLength,
  minValue,
  number,
  object,
  pipe,
  rawTransform,
  string,
} from "valibot";

import type { InferOutput } from "valibot";

// Mock User Schema
export const mockUserSchema = object({
  id: pipe(
    string("id must be a string"),
    minLength(1, "id must not be empty"),
    // biome-ignore lint/style/noMagicNumbers: fixture
    maxLength(36, "id must not exceed 36 characters"),
  ),
  email: pipe(
    string("email must be a string"),
    email("email must be a valid email"),
  ),
  age: pipe(
    number("age must be a number"),
    // biome-ignore lint/style/noMagicNumbers: fixture
    minValue(18, "age must be 18 or older"),
  ),
  name: pipe(
    string("name must be a string"),
    rawTransform(({ dataset, addIssue }) => {
      if (dataset.value === "my-invalid-name") {
        addIssue({
          message: "name must be a valid name",
        });
      }

      return dataset.value.trim();
    }),
  ),
});

// Type for our mock user
export type MockUser = InferOutput<typeof mockUserSchema>;

// Sample valid user data
export const mockValidUser: MockUser = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  email: "test@example.com",
  name: "John Doe",
  age: 25,
};

// Invalid mock user data that will cause an input error
export const mockInvalidUserForInputError = {
  id: "",
  email: "invalid-email",
  age: 16,
};

// Invalid mock user data that will cause a schema validation error
export const mockInvalidUserForSchemaValidationError = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  email: "myemail@example.com",
  age: "18",
  name: "John Doe",
};

// Invalid mock user data that will cause a transformation error
export const mockInvalidUserForTransformationError = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  email: "myemail@example.com",
  age: 18,
  name: "my-invalid-name",
};
