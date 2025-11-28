import assert from "node:assert/strict";
import { Duplex } from "node:stream";
import { describe, it } from "node:test";
import { readableToUint8Array } from "../readable-to-uint8array.js";


describe("readableToUint8Array", async () => {
  it("should return empty array for empty stream", async () => {
    const data = new Duplex();
    data.push(null);
    data.end();
    const result = await readableToUint8Array(data);
    assert.equal(result.length, 0);
  });
});
