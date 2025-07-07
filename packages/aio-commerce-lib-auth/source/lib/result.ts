const SuccessOrFailure = {
  SUCCESS: "success",
  FAILURE: "failure",
} as const;

export type SuccessOrFailure =
  (typeof SuccessOrFailure)[keyof typeof SuccessOrFailure];

export type Success<T> = { type: SuccessOrFailure; value: T; error: never };
export type Failure<E extends ErrorType> = {
  type: SuccessOrFailure;
  value: never;
  error: E;
};
export type Result<T, E extends ErrorType> = {
  type: SuccessOrFailure;
  value: T;
  error: E;
};

export type ErrorType = {
  _tag: string;
  [key: string]: unknown;
};

export function succeed<T>(value: T): Success<T> {
  return { type: SuccessOrFailure.SUCCESS, value, error: undefined as never };
}

export function fail<E extends ErrorType>(error: E): Failure<E> {
  return { type: SuccessOrFailure.FAILURE, error, value: undefined as never };
}

export function getData<T, E extends ErrorType>(result: Result<T, E>): T {
  if (result.type === SuccessOrFailure.SUCCESS) {
    return result.value;
  }
  throw new Error("Cannot get data from a Failure");
}

export function getError<T, E extends ErrorType>(result: Result<T, E>): E {
  if (result.type === SuccessOrFailure.FAILURE) {
    return (result as Failure<E>).error;
  }
  throw new Error("Cannot get error from a Success");
}

export function isSuccess<T, E extends ErrorType>(
  result: Result<T, E>,
): boolean {
  return result.type === SuccessOrFailure.SUCCESS;
}

export function isFailure<T, E extends ErrorType>(
  result: Result<T, E>,
): boolean {
  return result.type === SuccessOrFailure.FAILURE;
}
