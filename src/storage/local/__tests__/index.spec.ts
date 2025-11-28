import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { after, before, describe, it } from "node:test";
import { fastify } from "fastify";
import { equalByte, readableToUint8Array, uint8ArrayToReadable } from "#util";
import { LocalStorage } from "../index.js";


describe("LocalStorage", async () => {
  let storage: LocalStorage;
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
  });

  // it("should write and read metadata equals", async () => {
  //   const body = Readable.from(new Uint8Array(randomBytes(32)));
  //   const key = randomUUID();
  //   const expected = "image/jpeg";
  //   await storage.write(key, { blob: body, contentType: expected });
  //   const result = await storage.readMetadata(key);
  //   assert.equal(result.contentType, expected);
  // });

  after(async () => {
    await Promise.allSettled(keys.map(key => storage.delete(key)));
  });
});
