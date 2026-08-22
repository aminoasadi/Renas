import { Injectable } from "@nestjs/common";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AppConfig } from "../config/config.service";

/**
 * The only file that knows about S3 specifically. Works unmodified against
 * AWS S3, Cloudflare R2, ArvanCloud, or local MinIO — all speak the same
 * S3 API, and which one is in use is purely a matter of the S3_* env vars.
 */
@Injectable()
export class S3Service {
  private readonly client: S3Client;

  constructor(private readonly config: AppConfig) {
    const s3 = this.config.s3;
    this.client = new S3Client({
      endpoint: s3.endpoint,
      region: s3.region,
      forcePathStyle: s3.forcePathStyle,
      credentials: {
        accessKeyId: s3.accessKeyId,
        secretAccessKey: s3.secretAccessKey,
      },
    });
  }

  async upload(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.s3.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return this.publicUrlFor(key);
  }

  async getPresignedUploadUrl(key: string, contentType: string, expiresInSeconds = 300): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.config.s3.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.s3.bucket, Key: key }));
  }

  publicUrlFor(key: string): string {
    return `${this.config.s3.publicUrl.replace(/\/$/, "")}/${key}`;
  }
}
