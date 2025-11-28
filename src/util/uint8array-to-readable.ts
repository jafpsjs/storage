import { Duplex } from "node:stream";
import type { Readable } from "node:stream";

export function uint8ArrayToReadable(blob: Uint8Array): Readable {
  const stream = new Duplex();
  stream.push(blob);
  stream.push(null);
  return stream;
}
