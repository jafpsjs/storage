import type { StorageInput } from "./storage-input.js";
import type { StorageMetadataOutput } from "./storage-metadata-output.js";
import type { StorageOutput } from "./storage-output.js";


export interface Storage {
  delete(key: string): Promise<void>;
  name(): string;
  read(key: string): Promise<StorageOutput>;
  readMetadata(key: string): Promise<StorageMetadataOutput>;
  write(key: string, input: StorageInput): Promise<StorageMetadataOutput>;
}
