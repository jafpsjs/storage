import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { env } from "node:process";
import { after, before, describe, it } from "node:test";
import { fastify } from "fastify";
import { equalByte, readableToUint8Array, uint8ArrayToReadable } from "#util";
import { S3Storage } from "../index.js";


describe("S3Storage", async () => {
  let storage: S3Storage;
  let keys: string[];

  before(async () => {
    const app = fastify();
    keys = [];
    storage = new S3Storage({
      accessKey: env.TEST_S3_ACCESS_KEY ?? "",
      bucket: env.TEST_S3_BUCKET ?? "",
      endpoint: `http://127.0.0.1:${env.TEST_S3_PORT}`,
      logger: app.log,
      region: env.TEST_S3_REGION ?? "",
      secretKey: env.TEST_S3_SECRET_KEY ?? ""
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

  it("should write and read metadata equals", async () => {
    const blob = new Uint8Array(randomBytes(32));
    const key = randomUUID();
    const expected = "image/jpeg";
    await storage.write(key, { blob: uint8ArrayToReadable(blob), contentType: expected });
    const result = await storage.readMetadata(key);
    assert.equal(result.contentType, expected);
  });

  after(async () => {
    await Promise.allSettled(keys.map(key => storage.delete(key)));
  });
});
