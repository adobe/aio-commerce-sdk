/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import * as v from "valibot";

export const SimpleObjectSchema = v.object({
  foo: v.string(),
});

export const StringArgSchema = v.tuple([v.string()]);

export const NumberOutputSchema = v.number();

export const UserSchema = v.object({
  id: v.string(),
  name: v.string(),
  age: v.pipe(v.number(), v.minValue(0)),
});

export const NestedEmailSchema = v.object({
  user: v.object({
    profile: v.object({
      email: v.pipe(v.string(), v.email()),
    }),
  }),
});

export const UppercaseTransformSchema = v.pipe(
  v.string(),
  v.transform((value) => value.toUpperCase()),
);
