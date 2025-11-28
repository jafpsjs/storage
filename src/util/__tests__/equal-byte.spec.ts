import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";
import { equalByte } from "../equal-byte.js";


describe("equalByte", async () => {
  it("should return true for equal Buffer", async () => {
    const data = randomBytes(32);
    const result = equalByte(Buffer.from(data), Buffer.from(data));
    assert.equal(result, true);
  });

  it("should return false for non-equal Buffer", async () => {
    const data1 = randomBytes(32);
    const data2 = randomBytes(32);
    const result = equalByte(Buffer.from(data1), Buffer.from(data2));
    assert.equal(result, false);
  });

  it("should return false for non-equal length Buffer", async () => {
    const data1 = randomBytes(32);
    const data2 = randomBytes(16);
    const result = equalByte(Buffer.from(data1), Buffer.from(data2));
    assert.equal(result, false);
  });

  it("should return true for equal Uint8Array", async () => {
    const data = randomBytes(32);
    const result = equalByte(new Uint8Array(data), new Uint8Array(data));
    assert.equal(result, true);
  });

  it("should return false for non-equal Uint8Array", async () => {
    const data1 = randomBytes(32);
    const data2 = randomBytes(32);
    const result = equalByte(new Uint8Array(data1), new Uint8Array(data2));
    assert.equal(result, false);
  });

  it("should return false for non-equal length Uint8Array", async () => {
    const data1 = randomBytes(32);
    const data2 = randomBytes(16);
    const result = equalByte(new Uint8Array(data1), new Uint8Array(data2));
    assert.equal(result, false);
  });

  it("should return true for equal ArrayBuffer", async () => {
    const data = randomBytes(32);
    const result = equalByte(new Uint8Array(data).buffer, new Uint8Array(data).buffer);
    assert.equal(result, true);
  });

  it("should return false for non-equal ArrayBuffer", async () => {
    const data1 = randomBytes(32);
    const data2 = randomBytes(32);
    const result = equalByte(new Uint8Array(data1).buffer, new Uint8Array(data2).buffer);
    assert.equal(result, false);
  });

  it("should return false for non-equal length ArrayBuffer", async () => {
    const data1 = randomBytes(32);
    const data2 = randomBytes(16);
    const result = equalByte(new Uint8Array(data1).buffer, new Uint8Array(data2).buffer);
    assert.equal(result, false);
  });

  it("should return true for equal Uint8Array and Buffer", async () => {
    const data = randomBytes(32);
    const result1 = equalByte(Buffer.from(data), new Uint8Array(data));
    assert.equal(result1, true);
    const result2 = equalByte(new Uint8Array(data), Buffer.from(data));
    assert.equal(result2, true);
  });
});
