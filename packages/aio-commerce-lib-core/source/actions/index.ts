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

/**
 * This module exports core action utilities for the AIO Commerce SDK.
 * @packageDocumentation
 */

/* biome-ignore-all lint/performance/noBarrelFile: export as part of the Public API */

import { ok } from "#responses/presets";
import { Router } from "./rest/router";
export { defineRoute, Router } from "./rest/router";

import * as v from "valibot";

export const router = new Router();

router.get("/test/:id", {
  params: v.object({ id: v.string() }),
  handler: (req) => {
    return ok({
      body: {
        message: "Test route successful",
        receivedId: req.params.id,
      },
    });
  },
});

export type * from "./rest/types";
