import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, rmdir, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import cloneable from "cloneable-readable";
import { assertValidKey } from "#util";
import { checksumOf } from "./checksum-of.js";
import type { FastifyBaseLogger } from "fastify";
import type { Storage, StorageInput, StorageMetadataOutput, StorageOutput } from "#type";

interface LocalMetadata {
  checksum?: string;
  contentType?: string;
  eTag?: string;
}

interface LocalStat {
  contentLength: number;
  lastModified: Date;
}

export interface LocalStorageOptions {
  baseDir: string;
  logger: FastifyBaseLogger;
  metadataEncoding?: BufferEncoding;
}

export class LocalStorage implements Storage {
  private readonly baseDir: string;
  private readonly logger: FastifyBaseLogger;
  private readonly blobKey = "blob";
  private readonly metadataKey = "metadata.json";
  private readonly metadataEncoding: BufferEncoding;

  public constructor(opts: LocalStorageOptions) {
    const { baseDir, logger, metadataEncoding = "utf-8" } = opts;
    this.baseDir = baseDir;
    this.logger = logger;
    this.metadataEncoding = metadataEncoding;
  }

  private dirPath(key: string): string {
    return join(this.baseDir, key);
  }

  private blobPath(key: string): string {
    return join(this.dirPath(key), this.blobKey);
  }

  private metadataPath(key: string): string {
    return join(this.dirPath(key), this.metadataKey);
  }

  private async readLocalMetadata(key: string): Promise<LocalMetadata> {
    const metadataPath = this.metadataPath(key);
    const metadataString = await readFile(metadataPath, { encoding: this.metadataEncoding });
    try {
      const { checksum, contentType, eTag } = JSON.parse(metadataString);
      if (typeof contentType !== "string" && typeof contentType !== "undefined") {
        throw new Error("Invalid contentType");
      }
      if (typeof eTag !== "string" && typeof eTag !== "undefined") {
        throw new Error("Invalid eTag");
      }
      if (typeof checksum !== "string" && typeof checksum !== "undefined") {
        throw new Error("Invalid checksum");
      }
      return { checksum, contentType, eTag };
    } catch {
      this.logger.warn({ key }, "Failed to parse metadata");
      return { };
    }
  }

  private async readLocalStat(key: string): Promise<LocalStat> {
    const contentPath = this.blobPath(key);
    const stats = await stat(contentPath);
    const lastModified = stats.mtime;
    const contentLength = stats.size;
    return { contentLength, lastModified };
  }

  private async writeMetadata(path: string, input: StorageInput): Promise<StorageMetadataOutput> {
    const { blob, contentType } = input;
    const checksum = await checksumOf(blob);
    const metadata: LocalMetadata = { checksum, contentType, eTag: `"${checksum}"` };
    await writeFile(path, JSON.stringify(metadata), { encoding: this.metadataEncoding, mode: 0o600 });
    return metadata;
  }

  private async writeBlob(path: string, input: StorageInput): Promise<void> {
    const { blob } = input;
    const ws = createWriteStream(path, { mode: 0o600 });
    await pipeline(blob, ws);
    ws.end();
  }

  public async delete(key: string): Promise<void> {
    this.logger.debug({ key }, "Delete file");
    assertValidKey(key);
    try {
      await Promise.all([
        unlink(this.blobPath(key)),
        unlink(this.metadataPath(key))
      ]);
      await rmdir(this.dirPath(key));
    } catch (err) {
      this.logger.error({ err }, "Failed to delete file");
    }
  }

  public async write(key: string, input: StorageInput): Promise<StorageMetadataOutput> {
    this.logger.debug({ key }, "Write file");
    assertValidKey(key);
    const { blob, contentType } = input;
    if (typeof contentType !== "string" && typeof contentType !== "undefined") {
      throw new Error("contentType must be string or undefined");
    }
    const blobPath = this.blobPath(key);
    const metadataPath = this.metadataPath(key);
    try {
      await mkdir(dirname(blobPath), { recursive: true });
      const blobStream = cloneable(blob);
      const metadataStream = blobStream.clone();
      const [metadata] = await Promise.all([
        this.writeMetadata(metadataPath, { blob: metadataStream, contentType }),
        this.writeBlob(blobPath, { blob: blobStream, contentType })
      ]);
      return metadata;
    } catch (err) {
      this.logger.error({ err }, "Failed to write file");
      await this.delete(key);
      throw err;
    }
  }

  public async read(key: string): Promise<StorageOutput> {
    this.logger.debug({ key }, "Read file");
    assertValidKey(key);
    const blobPath = this.blobPath(key);
    const metadata = await this.readMetadata(key);
    return {
      ...metadata,
      body: createReadStream(blobPath)
    };
  }

  public async readMetadata(key: string): Promise<StorageMetadataOutput> {
    this.logger.debug({ key }, "Read file metadata");
    assertValidKey(key);
    const blobPath = this.blobPath(key);
    const [metadata, stats] = await Promise.all([
      this.readLocalMetadata(key),
      this.readLocalStat(key)
    ]);
    const eTag = metadata.eTag ?? await checksumOf(createReadStream(blobPath));
    return {
      ...metadata,
      ...stats,
      eTag
    };
  }
}
