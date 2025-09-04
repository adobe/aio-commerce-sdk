export const getMethodTest = {
  method: "get",
  options: { headers: { "X-Test": "value" } },
} as const;

export const postMethodTest = {
  method: "post",
  options: { json: { data: "test" } },
} as const;

export const putMethodTest = {
  method: "put",
  options: { json: { data: "test" } },
} as const;

export const deleteMethodTest = {
  method: "delete",
  options: undefined,
} as const;

export const patchMethodTest = {
  method: "patch",
  options: { json: { data: "test" } },
} as const;

export const headMethodTest = {
  method: "head",
  options: null,
} as const;

export const httpMethodTests = [
  getMethodTest,
  postMethodTest,
  putMethodTest,
  deleteMethodTest,
  patchMethodTest,
  headMethodTest,
] as const;
