/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { summarize, ValidationError } from './utils';
import  * as v from 'valibot';

describe('summarize', () => {
  it('should format a list of issues with colors and structure', () => {
    const SimpleObjectSchema = v.object({
      key1: v.string(),
      key2: v.number(),
      key3: v.object({
        nestedKey: v.object({
          nestedKey: v.boolean(),
        }),
      }),
    });

    const test = { key3: { nestedKey: {
      nestedKey: 'nestedKey',
        }}};
    const result = v.safeParse(SimpleObjectSchema, test);
    const output = summarize(
      new ValidationError(
        "Validation error", result.issues as [v.BaseIssue<unknown>, ...v.BaseIssue<unknown>[]]));
    expect(output).toContain('key1');
    expect(output).toContain('key2');
    expect(output).toContain('key3.nestedKey.nestedKey');
    console.log(output);
  });
});
