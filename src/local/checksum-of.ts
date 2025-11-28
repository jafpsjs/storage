import { createHash } from "node:crypto";
import { pipeline } from "node:stream/promises";
import type { Readable } from "node:stream";

export async function checksumOf(data: Readable): Promise<string> {
  const hash = createHash("sha256").setEncoding("hex");
  await pipeline(data, hash);
  hash.end();
  return hash.read();
}
