import type { Readable } from "node:stream";
import type { StorageMetadataOutput } from "./storage-metadata-output.js";

export interface StorageOutput extends StorageMetadataOutput {
  body: Readable;
}
