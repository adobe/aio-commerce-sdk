import type { KyInstance, Options } from "ky";

/**
 * Extends the given Ky instance with the provided options if they are provided.
 * @param ky - The Ky instance to extend.
 * @param options - The options to extend the Ky instance with.
 */
export function optionallyExtendKy<TKy extends KyInstance>(
  ky: TKy,
  options?: Options | ((parentOptions: Options) => Options),
): TKy {
  return options ? (ky.extend(options) as TKy) : ky;
}
