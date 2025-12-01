import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isValidKey } from "../is-valid-key.js";


describe("isValidKey", async () => {
  it("should return true if only contain valid characters", async () => {
    const result = isValidKey("1-23-4");
    assert.equal(result, true);
  });

  it("should return false if contain invalid characters", async () => {
    const result = isValidKey("1-23-4!");
    assert.equal(result, false);
  });
});
