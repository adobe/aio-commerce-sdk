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

function maskSecrets(obj: unknown, maskKeys: string[]): unknown {
  if (Array.isArray(obj)) {
    return obj.map(item => maskSecrets(item, maskKeys));
  } else if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        maskKeys.includes(key) ? '***' : maskSecrets(value, maskKeys),
      ])
    );
  }
  return obj;
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
  maskKeys: string[] = []
): string {
  const maskedOutput = maskSecrets(result.output, maskKeys);

  return `${whiteBright(message)}:
${JSON.stringify(maskedOutput, null, 2)}
${prettyPrintIssues(result.issues as v.BaseIssue<TInput>[])}
   `;
}
