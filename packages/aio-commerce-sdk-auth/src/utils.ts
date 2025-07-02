import { whiteBright, cyanBright, dim } from 'ansis';
import * as v from 'valibot';

const LAST_RETURN_CHAR = '└── ';
const RETURN_CHAR = '├── ';

type IssueKind = 'schema' | 'validation' | 'transformation';

const mapToText = {
  schema: 'Schema validation error',
  validation: 'Input error',
  transformation: 'Transformation error',
}

function composeIssue<TInput>(issue: v.BaseIssue<TInput>): string {
  const kindText = whiteBright(mapToText[issue.kind as IssueKind] || 'Unmapped issue kind');

  const dotPath = v.getDotPath(issue);
  const path = dotPath ? cyanBright(dotPath) + whiteBright(dim(' →')) : '';
  return `${kindText}: ${path} ${whiteBright(issue.message)}`;
}

function prettyPrintIssues<TInput>(issues: v.BaseIssue<TInput>[]): string {
  const total = issues.length;
  return "\n" + issues
    .map((issue: v.BaseIssue<TInput>, index: number) => {
      const returnChar = cyanBright(index + 1 === total ? LAST_RETURN_CHAR : RETURN_CHAR);
      return `${returnChar} ${composeIssue(issue)}`;
    })
    .join('\n');
}

export function prettyPrint<TInput>(
  message: string,
  result: v.SafeParseResult<v.BaseSchemaAsync<TInput, TInput, v.BaseIssue<TInput>>>,
): string {

  return `${whiteBright(message)}:
${JSON.stringify(result.output, null, 2)}
${prettyPrintIssues(result.issues as v.BaseIssue<TInput>[])}
   `;
}
