import { Duplex } from "node:stream";
import type { Readable } from "node:stream";

export function createEmptyStream(): Readable {
  const data = new Duplex();
  data.push(null);
  data.end();
  return data;
}
