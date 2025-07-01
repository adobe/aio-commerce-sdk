import { prettyPrint } from './utils';
import  * as v from 'valibot';

describe('prettyPrint', () => {
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
    const output = prettyPrint("Validation error", result);
    expect(output).toContain('key1');
    expect(output).toContain('key2');
    expect(output).toContain('key3.nestedKey.nestedKey');
  });
});
