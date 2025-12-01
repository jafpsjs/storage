import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { env } from "node:process";
import { after, before, describe, it } from "node:test";
import { S3Client } from "@aws-sdk/client-s3";
import { fastify } from "fastify";
import { equalByte, readableToUint8Array, uint8ArrayToReadable } from "#util";
import { S3Storage } from "../index.js";
import type { Storage } from "#type";


describe("S3Storage", async () => {
  let storage: Storage;
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

  it("should write and read equals with direct client", async () => {
    const app = fastify();
    keys = [];
    const client = new S3Client({
      credentials: {
        accessKeyId: env.TEST_S3_ACCESS_KEY ?? "",
        secretAccessKey: env.TEST_S3_SECRET_KEY ?? ""
      },
      endpoint: `http://127.0.0.1:${env.TEST_S3_PORT}`,
      forcePathStyle: true,
      region: env.TEST_S3_REGION ?? "",
      requestChecksumCalculation: "WHEN_SUPPORTED"
    });
    const storage = new S3Storage({
      bucket: env.TEST_S3_BUCKET ?? "",
      client,
      logger: app.log
    });
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

  it("should throw if key is invalid", async () => {
    const blob = new Uint8Array(randomBytes(32));
    const key = "\\/?!.*";
    assert.rejects(async () => {
      await storage.write(key, { blob: uint8ArrayToReadable(blob) });
    });
  });

  after(async () => {
    await Promise.allSettled(keys.map(key => storage.delete(key)));
  });
});
