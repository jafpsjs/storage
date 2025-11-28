import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createEmptyStream } from "../create-empty-stream.js";
import { readableToUint8Array } from "../readable-to-uint8array.js";


describe("createEmptyStream", async () => {
  it("should return true for equal Buffer", async () => {
    const data = createEmptyStream();
    const result = await readableToUint8Array(data);
    assert.equal(result.length, 0);
  });
});
