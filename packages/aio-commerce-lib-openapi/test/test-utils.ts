/**
 * Helper function to omit the type property from response objects.
 * This is useful for testing as we don't want to compare the type
 * discriminator in our assertions.
 */
export const omitType = <T extends Record<PropertyKey, unknown>>(
  response: T,
) => {
  const { type: _type, ...rest } = response;
  return rest;
};
