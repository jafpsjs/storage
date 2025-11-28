import { Duplex } from "node:stream";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import type { Readable } from "node:stream";
import type { NodeJsClient } from "@smithy/types";
import type { FastifyBaseLogger } from "fastify";
import type { Storage, StorageInput, StorageMetadataOutput, StorageOutput } from "#type";

export interface S3StorageConfigOptions {
  accessKey: string;
  bucket: string;
  endpoint?: string;
  region?: string;
  secretKey: string;
}

export interface S3StorageInstanceOptions {
  bucket: string;
  client: S3Client;
  logger: FastifyBaseLogger;
}

export type S3StorageOptions = { logger: FastifyBaseLogger } & (S3StorageConfigOptions | S3StorageInstanceOptions);

function createEmptyStream(): Readable {
  const data = new Duplex();
  data.push(null);
  data.end();
  return data;
}


export class S3Storage implements Storage {
  private readonly client: NodeJsClient<S3Client>;
  private readonly bucket: string;
  private readonly logger: FastifyBaseLogger;

  public constructor(opts: S3StorageOptions) {
    const { bucket, logger } = opts;
    this.bucket = bucket;
    this.logger = logger;
    if ("client" in opts) {
      this.client = opts.client;
    } else {
      const {
        accessKey: accessKeyId,
        endpoint,
        region = "us-east-1",
        secretKey: secretAccessKey
      } = opts;
      this.client = new S3Client({
        credentials: {
          accessKeyId,
          secretAccessKey
        },
        endpoint,
        forcePathStyle: true,
        region,
        requestChecksumCalculation: "WHEN_SUPPORTED"
      });
    }
  }

  public async write(key: string, input: StorageInput): Promise<StorageMetadataOutput> {
    this.logger.debug({ key }, "Write file");
    const { blob, contentType } = input;
    const upload = new Upload({
      client: this.client,
      params: {
        Body: blob,
        Bucket: this.bucket,
        ChecksumAlgorithm: "SHA256",
        ContentType: contentType,
        Key: key
      }
    });
    const res = await upload.done();
    return {
      checksum: res.ChecksumSHA256,
      contentType,
      eTag: res.ETag
    };
  }


  public async read(key: string): Promise<StorageOutput> {
    this.logger.debug({ key }, "Read file");
    const cmd = new GetObjectCommand({
      Bucket: this.bucket,
      ChecksumMode: "ENABLED",
      Key: key
    });
    const res = await this.client.send(cmd);
    const body = res.Body ?? createEmptyStream();
    return {
      body,
      contentLength: res.ContentLength,
      contentType: res.ContentType,
      eTag: res.ETag,
      lastModified: res.LastModified
    };
  }

  public async readMetadata(key: string): Promise<StorageMetadataOutput> {
    this.logger.debug({ key }, "Read file metadata");
    const cmd = new HeadObjectCommand({
      Bucket: this.bucket,
      ChecksumMode: "ENABLED",
      Key: key
    });
    const res = await this.client.send(cmd);
    return {
      checksum: res.ChecksumSHA256,
      contentLength: res.ContentLength,
      contentType: res.ContentType,
      eTag: res.ETag,
      lastModified: res.LastModified
    };
  }

  public async delete(key: string): Promise<void> {
    this.logger.debug({ key }, "Delete file");
    const cmd = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key
    });
    await this.client.send(cmd);
  }
}
