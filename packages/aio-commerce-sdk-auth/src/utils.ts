import ansis, { whiteBright, cyanBright } from 'ansis';
import { BaseIssue } from 'valibot';

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

  let received = '';

  if (issue.expected) {
    received = `Received: ${whiteBright(issue.received)} but expected: ${whiteBright(issue.expected)}`;
  } else {
    received = `Received: ${whiteBright(issue.received)}`;
  }

  let result = `${kindText} ${issue.path?.join('.')} - ${whiteBright(issue.message)}
      | ${received}
   `;


  if (issue.issues) {
    result += `\n${prettyPrintIssues(issue.issues)}`;
  }

  return result;
}

export function prettyPrintIssues<TInput>(issues: BaseIssue<TInput>[]): string {
  console.log(issues);
  const total = issues.length;
  return issues
    .map((issue: BaseIssue<TInput>, index: number) => {
      const returnChar = cyanBright(index + 1 === total ? LAST_RETURN_CHAR : RETURN_CHAR);
      return `${returnChar} ${composeIssue(issue)}`;
    })
    .join('\n');
}
