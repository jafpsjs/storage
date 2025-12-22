import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import { fastify } from "fastify";
import { equalByte, readableToUint8Array, uint8ArrayToReadable } from "#util";
import { LocalStorage } from "../index.js";
import type { Storage } from "#type";


describe("LocalStorage", async () => {
  let storage: Storage;
  let keys: string[];

  before(async () => {
    const app = fastify();
    keys = [];
    storage = new LocalStorage({
      baseDir: tmpdir(),
      logger: app.log
    });
  });

  it("should write and read equals", async () => {
    const expected = new Uint8Array(randomBytes(32));
    const key = randomUUID();
    keys.push(key);
    await storage.write(key, { blob: uint8ArrayToReadable(expected) });
    const result = await storage.read(key);
    const buffer = await readableToUint8Array(result.body);
    assert.ok(equalByte(buffer, expected));
    assert.ok(result.eTag);
    assert.ok(result.checksum);
  });

  it("should write and read metadata equals", async () => {
    const blob = new Uint8Array(randomBytes(32));
    const key = randomUUID();
    const expected = "image/jpeg";
    await storage.write(key, { blob: uint8ArrayToReadable(blob), contentType: expected });
    const result = await storage.readMetadata(key);
    assert.equal(result.contentType, expected);
  });

  it("should throw if key is invalid", async () => {
    const blob = new Uint8Array(randomBytes(32));
    const key = "\\/?!.*";
    assert.rejects(async () => {
      await storage.write(key, { blob: uint8ArrayToReadable(blob) });
    });
  });

  it("should throw if contentType is invalid", async () => {
    const expected = new Uint8Array(randomBytes(32));
    const key = randomUUID();
    keys.push(key);
    assert.rejects(async () => {
      await storage.write(key, { blob: uint8ArrayToReadable(expected), contentType: 1 as any });
    });
  });

  it("should throw if metadata contentType is invalid", async () => {
    const key = randomUUID();
    const metadataPath = join(tmpdir(), key, "metadata.json");
    await mkdir(join(tmpdir(), key), { recursive: true });
    const json = { contentType: 1 };
    await writeFile(metadataPath, JSON.stringify(json), { encoding: "utf-8" });
    assert.rejects(async () => {
      await storage.readMetadata(key);
    });
    await unlink(metadataPath);
  });

  it("should throw if metadata eTag is invalid", async () => {
    const key = randomUUID();
    const metadataPath = join(tmpdir(), key, "metadata.json");
    await mkdir(join(tmpdir(), key), { recursive: true });
    const json = { eTag: 1 };
    await writeFile(metadataPath, JSON.stringify(json), { encoding: "utf-8" });
    assert.rejects(async () => {
      await storage.readMetadata(key);
    });
    await unlink(metadataPath);
  });

  it("should throw if metadata checksum is invalid", async () => {
    const key = randomUUID();
    const metadataPath = join(tmpdir(), key, "metadata.json");
    await mkdir(join(tmpdir(), key), { recursive: true });
    const json = { checksum: 1 };
    await writeFile(metadataPath, JSON.stringify(json), { encoding: "utf-8" });
    assert.rejects(async () => {
      await storage.readMetadata(key);
    });
    await unlink(metadataPath);
  });

  it("should delete directory if empty", async () => {
    const blob = new Uint8Array(randomBytes(32));
    const key = randomUUID();
    await storage.write(key, { blob: uint8ArrayToReadable(blob), contentType: "image/jpeg" });
    await storage.delete(key);
    const dirPath = join(tmpdir(), key);
    assert.equal(existsSync(dirPath), false);
  });

  it("should not delete directory if not empty", async () => {
    const blob = new Uint8Array(randomBytes(32));
    const key = randomUUID();
    await storage.write(key, { blob: uint8ArrayToReadable(blob), contentType: "image/jpeg" });
    const dirPath = join(tmpdir(), key);
    await writeFile(join(dirPath, "a"), "!", { encoding: "utf-8" });
    await storage.delete(key);
    const dirContent = await readdir(dirPath);
    assert.equal(dirContent.length, 1);
  });

  after(async () => {
    await Promise.allSettled(keys.map(key => storage.delete(key)));
  });
});
