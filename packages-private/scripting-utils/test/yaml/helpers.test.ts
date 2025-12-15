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

import { join } from "node:path";

import { describe, expect, test } from "vitest";
import { Document, isMap, isSeq } from "yaml";

import { withTempFiles } from "#filesystem/temp";
import { getOrCreateMap, getOrCreateSeq, readYamlFile } from "#yaml/helpers";

describe("readYamlFile", () => {
  test("should read and map YAML content with different types", async () => {
    const yamlContent = `
name: test-app
version: 1.0.0
enabled: true
count: 2
tags:
  - frontend
  - backend
config:
  timeout: 5000
  retries: 1
  nested:
    deep: value
`;

    await withTempFiles(
      {
        "config.yaml": yamlContent,
      },
      async (tempDir) => {
        const doc = await readYamlFile(join(tempDir, "config.yaml"));

        // Test string values
        expect(doc.get("name")).toBe("test-app");
        expect(doc.get("version")).toBe("1.0.0");

        // Test boolean
        expect(doc.get("enabled")).toBe(true);

        // Test number
        expect(doc.get("count")).toBe(2);

        // Test array
        const tags = doc.toJSON().tags;
        expect(Array.isArray(tags)).toBe(true);
        expect(tags).toEqual(["frontend", "backend"]);

        // Test nested objects
        const timeout = 5000;
        expect(doc.getIn(["config", "timeout"])).toBe(timeout);
        expect(doc.getIn(["config", "retries"])).toBe(1);
        expect(doc.getIn(["config", "nested", "deep"])).toBe("value");
      },
    );
  });

  test("should create empty document for non-existent file", async () => {
    await withTempFiles({}, async (tempDir) => {
      const doc = await readYamlFile(join(tempDir, "nonexistent.yaml"));
      expect(doc).toBeInstanceOf(Document);

      // Should have contents initialized as YAMLMap
      expect(doc.contents).toBeDefined();
      expect(doc.contents).not.toBeNull();

      // Should be able to work with the document
      doc.set("test", "value");
      expect(doc.get("test")).toBe("value");
    });
  });

  test("should handle empty YAML file", async () => {
    await withTempFiles(
      {
        "empty.yaml": "",
      },
      async (tempDir) => {
        const doc = await readYamlFile(join(tempDir, "empty.yaml"));
        expect(doc).toBeInstanceOf(Document);

        // Should have contents initialized as YAMLMap
        expect(doc.contents).toBeDefined();
        expect(doc.contents).not.toBeNull();

        // Should be able to work with the document
        doc.set("test", "value");
        expect(doc.get("test")).toBe("value");
      },
    );
  });

  test("should throw error when file read fails", async () => {
    // Test error handling by trying to read a directory as a file
    await withTempFiles(
      {
        "somedir/file.txt": "test",
      },
      async (tempDir) => {
        // Try to read the directory itself as a YAML file
        await expect(readYamlFile(join(tempDir, "somedir"))).rejects.toThrow(
          "Failed to parse somedir",
        );
      },
    );
  });
});

describe("getOrCreateSeq", () => {
  test("should create a new sequence if it doesn't exist", () => {
    const doc = new Document({});
    const seq = getOrCreateSeq(doc, ["items"]);

    expect(isSeq(seq)).toBe(true);
    expect(seq.items).toHaveLength(0);
  });

  test("should return existing sequence", () => {
    const doc = new Document({ items: ["item1", "item2"] });
    const seq = getOrCreateSeq(doc, ["items"]);

    expect(isSeq(seq)).toBe(true);
    expect(seq.items).toHaveLength(2);
  });

  test("should throw error if path contains non-sequence", () => {
    const doc = new Document({ items: "not a sequence" });

    expect(() => getOrCreateSeq(doc, ["items"])).toThrow(
      'Expected sequence at path "items"',
    );
  });

  test("should create nested sequence", () => {
    const doc = new Document({ parent: {} });
    const seq = getOrCreateSeq(doc, ["parent", "children"]);

    expect(isSeq(seq)).toBe(true);
    expect(doc.getIn(["parent", "children"])).toBe(seq);
  });

  test("should call onBeforeCreate callback", () => {
    const doc = new Document({});
    let callbackCalled = false;

    getOrCreateSeq(doc, ["items"], {
      onBeforeCreate: (pair) => {
        callbackCalled = true;
        // pair.key is a Scalar object in YAML library
        expect(pair.key?.toString()).toBe("items");
      },
    });

    expect(callbackCalled).toBe(true);
  });

  test("should replace empty path with new sequence", () => {
    const doc = new Document({ items: null });
    const seq = getOrCreateSeq(doc, ["items"]);

    expect(isSeq(seq)).toBe(true);
    expect(seq.items).toHaveLength(0);
  });
});

describe("getOrCreateMap", () => {
  test("should create a new map if it doesn't exist", () => {
    const doc = new Document({});
    const map = getOrCreateMap(doc, ["config"]);

    expect(isMap(map)).toBe(true);
    expect(map.items).toHaveLength(0);
  });

  test("should return existing map", () => {
    const timeout = 5000;
    const doc = new Document({ config: { enabled: true, timeout } });
    const map = getOrCreateMap(doc, ["config"]);

    expect(isMap(map)).toBe(true);
    expect(map.get("enabled")).toBe(true);
    expect(map.get("timeout")).toBe(timeout);
  });

  test("should throw error if path contains non-map", () => {
    const doc = new Document({ config: "not a map" });

    expect(() => getOrCreateMap(doc, ["config"])).toThrow(
      'Expected map at path "config"',
    );
  });

  test("should create nested map", () => {
    const doc = new Document({ parent: {} });
    const map = getOrCreateMap(doc, ["parent", "child"]);

    expect(isMap(map)).toBe(true);
    expect(doc.getIn(["parent", "child"])).toBe(map);
  });

  test("should call onBeforeCreate callback", () => {
    const doc = new Document({});
    let callbackCalled = false;

    getOrCreateMap(doc, ["config"], {
      onBeforeCreate: (pair) => {
        callbackCalled = true;
        // pair.key is a Scalar object in YAML library
        expect(pair.key?.toString()).toBe("config");
      },
    });

    expect(callbackCalled).toBe(true);
  });

  test("should replace empty path with new map", () => {
    const doc = new Document({ config: null });
    const map = getOrCreateMap(doc, ["config"]);

    expect(isMap(map)).toBe(true);
    expect(map.items).toHaveLength(0);
  });
});
