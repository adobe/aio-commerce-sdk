import type { ImsAuthParams } from "@adobe/aio-commerce-lib-auth";
import type { SetOptional } from "type-fest";

/** Defines the IMS authentication parameters with optional scopes. */
export type ImsAuthParamsWithOptionalScopes = SetOptional<
  ImsAuthParams,
  "scopes"
>;

/**
 * Ensures the correct scopes are set for the given IMS authentication parameters.
 * @param imsAuth - The IMS authentication parameters.
 * @param requiredScopes - The required scopes.
 */
export function ensureImsScopes(
  imsAuth: ImsAuthParamsWithOptionalScopes,
  requiredScopes: string[],
): ImsAuthParams {
  const scopes = new Set([...(imsAuth.scopes ?? []), ...requiredScopes]);
  return {
    ...imsAuth,
    scopes: Array.from(scopes),
  };
}
