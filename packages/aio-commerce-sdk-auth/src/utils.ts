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

import { yellowBright, whiteBright, cyanBright, dim } from 'ansis';
import * as v from 'valibot';

const LAST_RETURN_CHAR = '└── ';
const RETURN_CHAR = '├── ';

type IssueKind = 'schema' | 'validation' | 'transformation';

const mapToText = {
  schema: 'Schema validation error',
  validation: 'Input error',
  transformation: 'Transformation error',
}

function issueToDisplay<TInput>(issues: v.BaseIssue<TInput>[]): string {
  const total = issues.length;
  const lines: string[] = [];
  let index = 0;
  for (const issue of issues) {
    index++;
    const returnChar = cyanBright(index === total ? LAST_RETURN_CHAR : RETURN_CHAR);

    // Inline composeIssue logic
    const kindText = yellowBright(mapToText[issue.kind as IssueKind] || 'Unmapped issue kind');
    const dotPath = v.getDotPath(issue);
    const path = dotPath ? cyanBright(dotPath) + whiteBright(dim(' →')) : '';
    const issueLine = `${kindText} ${whiteBright('at')} ${path} ${whiteBright(issue.message)}`;

    lines.push(`${returnChar} ${issueLine}`);
  }
  return lines.join('\n');
}

export function summarize<TInput>(
  message: string,
  result: v.SafeParseResult<v.BaseSchemaAsync<TInput, TInput, v.BaseIssue<TInput>>>,
): string {
  return `${whiteBright(message)}:
${issueToDisplay(result.issues as v.BaseIssue<TInput>[])}
   `;
}
