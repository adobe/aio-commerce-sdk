/**
 * Helper function to return response objects as-is for testing.
 * Previously used to omit the type property, but now that the type
 * discriminator has been removed, this is a passthrough function.
 */
export const omitType = <T extends Record<PropertyKey, unknown>>(
  response: T,
) => {
  return response;
};
