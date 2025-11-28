import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { Duplex } from "node:stream";
import { describe, it } from "node:test";
import clonable from "cloneable-readable";
import { checksumOf } from "../checksum-of.js";


function toReadable(blob: Uint8Array): Duplex {
  const stream = new Duplex();
  stream.push(blob);
  stream.push(null);
  return stream;
}


describe("checksumOf", async () => {
  it("should write and read equals", async () => {
    const expected = new Uint8Array(randomBytes(32));
    const s1 = clonable(toReadable(expected));
    const s2 = s1.clone();
    const [r1, r2] = await Promise.all([
      checksumOf(s1),
      checksumOf(s2)
    ]);
    assert.equal(r1, r2);
  });
});
