import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";
import { equalByte } from "../equal-byte.js";
import { readableToUint8Array } from "../readable-to-uint8array.js";
import { uint8ArrayToReadable } from "../uint8array-to-readable.js";


describe("uint8ArrayToReadable", async () => {
  it("should return true for equal bytes", async () => {
    const data = new Uint8Array(randomBytes(32));
    const result = await readableToUint8Array(uint8ArrayToReadable(data));
    assert.equal(equalByte(data, result), true);
  });

  it("should return true for non-equal bytes", async () => {
    const data1 = new Uint8Array(randomBytes(0));
    const data2 = new Uint8Array(randomBytes(16));
    const result = await readableToUint8Array(uint8ArrayToReadable(data2));
    assert.equal(equalByte(data1, result), false);
  });
});
