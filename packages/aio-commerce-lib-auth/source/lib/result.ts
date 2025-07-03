const SuccessOrFailure = {
  SUCCESS: "success",
  FAILURE: "failure",
} as const;

export type SuccessOrFailure =
  (typeof SuccessOrFailure)[keyof typeof SuccessOrFailure];

export type Success<T> = Result<T, never>;
export type Failure<E extends ErrorType> = Result<never, E>;

export type ErrorType = {
  _tag: string;
  [key: string]: unknown;
};

export class Result<T, E extends ErrorType> {
  private readonly _tag: SuccessOrFailure;
  private readonly value: T | E;

  constructor(_tag: SuccessOrFailure, value: T | E) {
    this._tag = _tag;
    this.value = value;
  }

  static success<V>(value: V): Success<V> {
    return new Result(SuccessOrFailure.SUCCESS, value) as Success<V>;
  }

  static fail<ET extends ErrorType>(error: ET): Failure<ET> {
    return new Result(SuccessOrFailure.FAILURE, error) as Failure<ET>;
  }

  isSuccess(): boolean {
    return this._tag === SuccessOrFailure.SUCCESS;
  }

  isFailure(): boolean {
    return this._tag === SuccessOrFailure.FAILURE;
  }

  get data() {
    if (this.isSuccess()) {
      return this.value as T;
    }

    throw new Error("Cannot get data from a Failure");
  }

  get error() {
    if (this.isFailure()) {
      return this.value as E;
    }

    throw new Error("Cannot get error from a Success");
  }
}
