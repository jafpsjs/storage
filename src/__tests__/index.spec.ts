import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { env } from "node:process";
import { after, before, describe, it } from "node:test";
import { fastify } from "fastify";
import { equalByte, readableToUint8Array, uint8ArrayToReadable } from "#util";
import { LocalStorage, S3Storage } from "../index.js";
import type { Storage } from "#type";


function testStorage(storage: Storage): void {
  describe(storage.name(), () => {
    const keys: string[] = [];

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
}

describe("@jafps/storage", () => {
  const storages: Storage[] = [];

  before(async () => {
    const app = fastify();
    storages.push(new LocalStorage({
      baseDir: tmpdir(),
      logger: app.log
    }));
    storages.push(new S3Storage({
      accessKey: env.TEST_S3_ACCESS_KEY ?? "",
      bucket: env.TEST_S3_BUCKET ?? "",
      endpoint: `http://127.0.0.1:${env.TEST_S3_PORT}`,
      logger: app.log,
      region: env.TEST_S3_REGION ?? "",
      secretKey: env.TEST_S3_SECRET_KEY ?? ""
    }));
  });

  for (const storage of storages) {
    testStorage(storage);
  }
});
