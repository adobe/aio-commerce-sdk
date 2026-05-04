/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { describe, expectTypeOf, it } from "vitest";

import {
  getAdminUiSdkPermissionClient,
  withAdminUiSdkPermission,
} from "#index";

import type {
  AdminUiSdkPermissionClient,
  AdminUiSdkPermissionClientOptions,
  WithAdminUiSdkPermissionParams,
} from "#lib/commerce/admin-ui-sdk-permissions/types";
import type { AdobeCommerceHttpClient } from "#lib/commerce/http-client";

describe("AdminUiSdkPermissionClientOptions", () => {
  it("requires httpClient", () => {
    expectTypeOf<AdminUiSdkPermissionClientOptions>().toMatchTypeOf<{
      httpClient: AdobeCommerceHttpClient;
    }>();
  });

  it("makes cacheTtlMs and denyOnError optional", () => {
    const opts: AdminUiSdkPermissionClientOptions = {
      httpClient: {} as AdobeCommerceHttpClient,
    };

    expectTypeOf(opts.cacheTtlMs).toEqualTypeOf<number | undefined>();
    expectTypeOf(opts.denyOnError).toEqualTypeOf<boolean | undefined>();
  });
});

describe("AdminUiSdkPermissionClient", () => {
  it("has check, require, and invalidate", () => {
    expectTypeOf<AdminUiSdkPermissionClient["check"]>().toEqualTypeOf<
      (resource: string) => Promise<boolean>
    >();
    expectTypeOf<AdminUiSdkPermissionClient["require"]>().toEqualTypeOf<
      (resource: string) => Promise<void>
    >();
    expectTypeOf<AdminUiSdkPermissionClient["invalidate"]>().toEqualTypeOf<
      (resource?: string) => void
    >();
  });
});

describe("WithAdminUiSdkPermissionParams", () => {
  it("describes a resource, client, and handler", () => {
    expectTypeOf<
      WithAdminUiSdkPermissionParams<{ foo: string }, { statusCode: number }>
    >().toMatchTypeOf<{
      resource: string;
      client: AdminUiSdkPermissionClient;
      handler: (params: { foo: string }) => Promise<{ statusCode: number }>;
    }>();
  });
});

describe("package exports", () => {
  it("exports the permission client factory and action wrapper", () => {
    expectTypeOf(getAdminUiSdkPermissionClient).toBeFunction();
    expectTypeOf(withAdminUiSdkPermission).toBeFunction();
  });
});
