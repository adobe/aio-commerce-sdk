/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { describe, expect, test } from "vitest";

import {
  isBasicAuth,
  isBearerAuth,
  isOAuth,
  parseAuthorization,
  parseBasicToken,
  parseBearerToken,
  parseOAuthToken,
} from "#headers";

import type { GenericAuthorization } from "#headers";

describe("headers/auth", () => {
  describe("parseAuthorization", () => {
    test("should parse Bearer authorization", () => {
      const auth = parseAuthorization("Bearer token123");
      expect(auth).toEqual({ scheme: "Bearer", token: "token123" });
    });

    test("should parse Basic authorization", () => {
      const auth = parseAuthorization("Basic dXNlcjpwYXNz");
      expect(auth).toEqual({ scheme: "Basic", credentials: "dXNlcjpwYXNz" });
    });

    test("should parse OAuth authorization with parameters", () => {
      const auth = parseAuthorization(
        'OAuth oauth_consumer_key="key123", oauth_token="token456", oauth_signature="sig789"',
      );
      expect(auth).toEqual({
        scheme: "OAuth",
        parameters: {
          oauth_consumer_key: "key123",
          oauth_token: "token456",
          oauth_signature: "sig789",
        },
      });
    });

    test("should parse generic authorization schemes", () => {
      const auth = parseAuthorization("Digest realm=example");
      expect(auth).toEqual({
        scheme: "Digest",
        parametersRaw: "realm=example",
        parameters: {},
      });
    });

    test("should parse generic scheme with key-value parameters", () => {
      const auth = parseAuthorization('Digest realm="Example", nonce="abc123"');
      expect(auth).toMatchObject({
        scheme: "Digest",
        parametersRaw: 'realm="Example", nonce="abc123"',
        parameters: {
          realm: "Example",
          nonce: "abc123",
        },
      });
    });

    test("should trim scheme and parameters", () => {
      const auth = parseAuthorization(" Bearer token123 ");
      expect(auth.scheme).toBe("Bearer");
      if (isBearerAuth(auth)) {
        expect(auth.token).toBe("token123");
      }
    });

    test("should throw error for missing space", () => {
      expect(() => {
        parseAuthorization("Bearertoken123");
      }).toThrow("Invalid Authorization header format");
    });

    test("should throw error for empty scheme", () => {
      expect(() => {
        parseAuthorization(" token123");
      }).toThrow("Invalid Authorization header format");
    });

    test("should throw error for empty parameters", () => {
      expect(() => {
        parseAuthorization("Bearer ");
      }).toThrow("Invalid Authorization header format");

      expect(() => {
        parseAuthorization("Bearer    ");
      }).toThrow("Invalid Authorization header format");
    });

    test("should allow type narrowing with type guards", () => {
      const bearerAuth = parseAuthorization("Bearer token123");
      const basicAuth = parseAuthorization("Basic dXNlcjpwYXNz");
      const oauthAuth = parseAuthorization('OAuth oauth_token="abc"');
      const digestAuth = parseAuthorization('Digest realm="Example"');

      // Direct scheme checks work for assertions
      expect(bearerAuth.scheme).toBe("Bearer");
      expect(basicAuth.scheme).toBe("Basic");
      expect(oauthAuth.scheme).toBe("OAuth");
      expect(digestAuth.scheme).toBe("Digest");

      // Type narrowing works with type guards
      if (isBearerAuth(bearerAuth)) {
        expect(bearerAuth.token).toBe("token123");
      }

      if (isBasicAuth(basicAuth)) {
        expect(basicAuth.credentials).toBe("dXNlcjpwYXNz");
      }

      if (isOAuth(oauthAuth)) {
        expect(oauthAuth.parameters.oauth_token).toBe("abc");
      }

      // GenericAuthorization can be checked by excluding known schemes
      // Note: TypeScript cannot narrow automatically, so we use type assertion
      if (
        digestAuth.scheme !== "Bearer" &&
        digestAuth.scheme !== "Basic" &&
        digestAuth.scheme !== "OAuth"
      ) {
        // At runtime, we know this is GenericAuthorization
        const genericAuth = digestAuth as GenericAuthorization;
        expect(genericAuth.parametersRaw).toBe('realm="Example"');
        expect(genericAuth.parameters.realm).toBe("Example");
      }
    });

    test("should handle OAuth with various parameters", () => {
      const auth = parseAuthorization(
        'OAuth realm="Example", oauth_consumer_key="key", oauth_nonce="nonce"',
      );
      expect(auth.scheme).toBe("OAuth");
      if (auth.scheme === "OAuth") {
        expect(auth.parameters.realm).toBe("Example");
        expect(auth.parameters.oauth_consumer_key).toBe("key");
        expect(auth.parameters.oauth_nonce).toBe("nonce");
      }
    });

    test("should handle empty OAuth parameters object", () => {
      const auth = parseAuthorization("OAuth no-valid-params-here");
      expect(auth.scheme).toBe("OAuth");
      if (auth.scheme === "OAuth") {
        expect(auth.parameters).toEqual({});
      }
    });
  });

  describe("parseBearerToken", () => {
    test("should parse Bearer authorization", () => {
      const auth = parseBearerToken("Bearer test-token-123");
      expect(auth.scheme).toBe("Bearer");
      expect(auth.token).toBe("test-token-123");
    });

    test("should trim whitespace from Bearer token", () => {
      const auth = parseBearerToken("Bearer   test-token-with-spaces   ");
      expect(auth.token).toBe("test-token-with-spaces");
    });

    test("should handle complex JWT tokens", () => {
      const jwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
      const auth = parseBearerToken(`Bearer ${jwt}`);
      expect(auth.token).toBe(jwt);
    });

    test("should handle tokens with special characters", () => {
      const specialToken = "abc-123_XYZ.def+ghi/jkl=";
      const auth = parseBearerToken(`Bearer ${specialToken}`);
      expect(auth.token).toBe(specialToken);
    });

    test("should throw error for non-Bearer authorization", () => {
      expect(() => {
        parseBearerToken("Basic dXNlcjpwYXNz");
      }).toThrow("Authorization header must be a Bearer token");
    });

    test("should throw error for malformed Bearer without space", () => {
      expect(() => {
        parseBearerToken("Bearer");
      }).toThrow("Invalid Authorization header format");
    });

    test("should throw error for Bearer token with only whitespace", () => {
      expect(() => {
        parseBearerToken("Bearer    ");
      }).toThrow("Invalid Authorization header format");
    });

    test("should throw error for empty Bearer token after trimming", () => {
      expect(() => {
        parseBearerToken("Bearer \t\n  ");
      }).toThrow("Invalid Authorization header format");
    });

    test("should throw error for case-sensitive Bearer prefix", () => {
      expect(() => {
        parseBearerToken("bearer token123");
      }).toThrow("Authorization header must be a Bearer token");

      expect(() => {
        parseBearerToken("BEARER token123");
      }).toThrow("Authorization header must be a Bearer token");
    });

    test("should handle Bearer token without space", () => {
      // This should throw because "Bearer" prefix includes the space
      expect(() => {
        parseBearerToken("Bearertoken123");
      }).toThrow("Invalid Authorization header format");
    });
  });

  describe("parseBasicToken", () => {
    test("should parse Basic authorization", () => {
      const auth = parseBasicToken("Basic dXNlcjpwYXNz");
      expect(auth.scheme).toBe("Basic");
      expect(auth.credentials).toBe("dXNlcjpwYXNz");
    });

    test("should throw error for non-Basic scheme", () => {
      expect(() => {
        parseBasicToken("Bearer token123");
      }).toThrow("Authorization header must be Basic authentication");

      expect(() => {
        parseBasicToken("OAuth oauth_token=abc");
      }).toThrow("Authorization header must be Basic authentication");
    });
  });

  describe("parseOAuthToken", () => {
    test("should parse OAuth authorization", () => {
      const auth = parseOAuthToken(
        'OAuth oauth_consumer_key="key", oauth_token="token"',
      );
      expect(auth.scheme).toBe("OAuth");
      expect(auth.parameters.oauth_consumer_key).toBe("key");
      expect(auth.parameters.oauth_token).toBe("token");
    });

    test("should throw error for non-OAuth scheme", () => {
      expect(() => {
        parseOAuthToken("Bearer token123");
      }).toThrow("Authorization header must be OAuth");

      expect(() => {
        parseOAuthToken("Basic dXNlcjpwYXNz");
      }).toThrow("Authorization header must be OAuth");
    });
  });
});
