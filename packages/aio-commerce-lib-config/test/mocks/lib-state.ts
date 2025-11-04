/** biome-ignore-all lint/suspicious/useAwait: To mock with the same signature as the original method */

import { vi } from "vitest";

export function createMockLibState() {
  const MockLibState = vi.fn(
    class MockLibStateClass {
      private state = new Map<string, string>();

      public get = vi.fn(async (key: string) => {
        const data = this.state.get(key) || null;
        return { value: { data } };
      });
      public put = vi.fn(async (key: string, value: string) => {
        this.state.set(key, value);
      });
      public delete = vi.fn(async (key: string) => {
        this.state.delete(key);
      });
    },
  );

  return MockLibState;
}
