import { vi } from "vitest";

import type ky from "ky";
import type { KyInstance } from "ky";

/** Builds a mock Ky client without the `create` and `extend` factory methods. */
export function buildMockKyClientWithoutFactoryMethods() {
  const uniqueSymbol: unique symbol = Symbol.for("ky.stop");
  return {
    get: vi.fn().mockReturnValue(Promise.resolve()),
    post: vi.fn().mockReturnValue(Promise.resolve()),
    put: vi.fn().mockReturnValue(Promise.resolve()),
    delete: vi.fn().mockReturnValue(Promise.resolve()),
    patch: vi.fn().mockReturnValue(Promise.resolve()),
    head: vi.fn().mockReturnValue(Promise.resolve()),
    stop: uniqueSymbol as unknown as typeof ky.stop,
  } satisfies Omit<KyInstance, "create" | "extend">;
}

/** Builds a mock {@link KyInstance} client. */
export function buildMockKyClient() {
  const kyClient = {
    ...buildMockKyClientWithoutFactoryMethods(),
    extend: vi.fn().mockReturnValue(buildMockKyClientWithoutFactoryMethods()),
    create: vi.fn().mockReturnValue(buildMockKyClientWithoutFactoryMethods()),
  };

  const callSignature = vi.fn().mockReturnValue(Promise.resolve());
  return Object.assign(callSignature, kyClient) satisfies KyInstance;
}
