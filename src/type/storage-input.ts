import type { Readable } from "node:stream";

export interface StorageInput {
  blob: Readable;
  contentType?: string;
}
