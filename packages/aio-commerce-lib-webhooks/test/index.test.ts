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

import { describe, expect, it } from "vitest";

import {
  addOperation,
  created,
  ok,
  removeOperation,
  successOperation,
} from "../source/index";

describe("aio-commerce-lib-webhooks", () => {
  describe("webhook-optimized response functions", () => {
    it("should create ok response with single operation", () => {
      const response = ok(successOperation());

      expect(response).toEqual({
        type: "success",
        statusCode: 200,
        body: { op: "success" },
      });
    });

    it("should create ok response with array of operations", () => {
      const response = ok([
        addOperation("result", { data: "test" }),
        removeOperation("result/old_field"),
      ]);

      expect(response).toEqual({
        type: "success",
        statusCode: 200,
        body: [
          { op: "add", path: "result", value: { data: "test" } },
          { op: "remove", path: "result/old_field" },
        ],
      });
    });

    it("should create created response with single operation", () => {
      const response = created(successOperation());

      expect(response).toEqual({
        type: "success",
        statusCode: 201,
        body: { op: "success" },
      });
    });

    it("should create created response with array of operations", () => {
      const response = created([
        addOperation("result", { id: "123" }),
        addOperation("result/status", "created"),
      ]);

      expect(response).toEqual({
        type: "success",
        statusCode: 201,
        body: [
          { op: "add", path: "result", value: { id: "123" } },
          { op: "add", path: "result/status", value: "created" },
        ],
      });
    });
  });
});
