import util from "node:util";

/**
 * Helper type to define custom error options.
 * @example
 * ```ts
 * type ValidationErrorOptions = AioCommerceSdkErrorOptions<{
 *   field: string;
 *   value: unknown;
 * }>;
 * ```
 */
export type AioCommerceSdkErrorOptions<
  T extends Record<string, unknown> = Record<string, unknown>,
> = ErrorOptions &
  T & {
    tag: `${string}Error`;
    traceId?: string;
  };

/**
 * Base class for all AioCommerceSdk errors.
 * @example
 * ```ts
 * class ValidationError extends AioCommerceSdkErrorBase {
 *   constructor(message: string, options: ValidationErrorOptions) {
 *     super(message, options);
 *   }
 * }
 *
 * const err = new ValidationError("Invalid value", {
 *   tag: "ValidationError",
 *   field: "name",
 *   value: "John Doe",
 * });
 *
 * console.log(err.toJSON());
 * ```
 */
export abstract class AioCommerceSdkErrorBase extends Error {
  public readonly tag: string;
  public readonly traceId?: string;

  /**
   * Constructs a new AioCommerceSdkErrorBase instance.
   *
   * @param message - A human-friendly description of the error.
   * @param options - Required error options.
   */
  public constructor(
    message: string,
    { tag, traceId, ...options }: AioCommerceSdkErrorOptions,
  ) {
    super(message, options);

    // See TypeScript example on: https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/useonlythebuiltinerror.md#code-example--doing-it-even-better
    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);
    }

    this.name = "AioCommerceSdkError";
    this.tag = tag;
    this.traceId = traceId;
  }

  /** Checks if the error is an AioCommerceSdkErrorBase instance. */
  public static is(error: unknown): error is AioCommerceSdkErrorBase {
    return error instanceof AioCommerceSdkErrorBase;
  }

  /** Returns the full stack trace of the error and its causes. */
  public get fullStack() {
    let out = this.stack ?? "";
    let cause = this.cause;

    while (cause instanceof Error) {
      out += `\nCaused by: ${cause.stack ?? cause.message}`;
      cause = cause.cause;
    }

    return out;
  }

  /** Returns the root cause of the error. */
  public get rootCause() {
    let cause = this.cause;

    while (cause) {
      if (cause instanceof Error) {
        cause = cause.cause;
      } else {
        break;
      }
    }

    return cause;
  }

  /** Converts the error to a JSON-like representation. */
  public toJSON() {
    // This is needed, otherwise JSON.stringify returns '{}' 🤡
    return {
      name: this.name,
      message: this.message,
      stack: this.fullStack,
      cause: this.cause,
      tag: this.tag,
      traceId: this.traceId,
    };
  }

  /** Returns a pretty string representation of the error. */
  public toString(inspect = true) {
    if (inspect) {
      // This returns a pretty-printed string with more details than `toString`
      return util.inspect(this, {
        depth: null,
        colors: true,
        sorted: true,
        maxStringLength: Number.POSITIVE_INFINITY,
      });
    }

    return super.toString();
  }
}
