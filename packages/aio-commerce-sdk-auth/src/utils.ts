import { whiteBright, cyanBright } from 'ansis';
import { BaseIssue, getDotPath } from 'valibot';

const LAST_RETURN_CHAR = '└── ';
const RETURN_CHAR = '├── ';

type IssueKind = 'schema' | 'validation' | 'transformation';

const mapToText = {
  schema: 'Schema validation error',
  validation: 'Input error',
  transformation: 'Transformation error',
}

export function composeIssue<TInput>(issue: BaseIssue<TInput>): string {
  const kindText = whiteBright(mapToText[issue.kind as IssueKind] || 'Unmapped issue kind');

  const dotPath = getDotPath(issue);
  const path = dotPath ? cyanBright(dotPath) + whiteBright(' →') : '';
  return `${kindText}: ${path} ${whiteBright(issue.message)}`;
}

export function prettyPrintIssues<TInput>(issues: BaseIssue<TInput>[]): string {
  const total = issues.length;
  return "\n" + issues
    .map((issue: BaseIssue<TInput>, index: number) => {
      const returnChar = cyanBright(index + 1 === total ? LAST_RETURN_CHAR : RETURN_CHAR);
      return `${returnChar} ${composeIssue(issue)}`;
    })
    .join('\n');
}
