import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { nanoid } from "nanoid";
import sharp from "sharp";
import { PrismaService } from "../prisma/prisma.service";
import { S3Service } from "./s3.service";
import { ALLOWED_MIME_TYPES, detectActualMimeType } from "./file-signature.util";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB

export interface UploadMediaInput {
  originalFilename: string;
  buffer: Buffer;
  /** Null for anonymous public uploads (e.g. an RFQ attachment) — see `submitPublicAttachment`. */
  uploadedById?: string | null;
}

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async upload(input: UploadMediaInput) {
    if (input.buffer.length > MAX_UPLOAD_BYTES) {
      throw new BadRequestException(`File exceeds the maximum upload size of ${MAX_UPLOAD_BYTES / 1024 / 1024}MB`);
    }

    const actualMimeType = detectActualMimeType(input.buffer);
    if (!actualMimeType || !ALLOWED_MIME_TYPES.includes(actualMimeType)) {
      throw new BadRequestException("Unsupported or unrecognized file type");
    }

    let width: number | undefined;
    let height: number | undefined;
    if (actualMimeType.startsWith("image/")) {
      const metadata = await sharp(input.buffer).metadata();
      width = metadata.width;
      height = metadata.height;
    }

    const extension = actualMimeType.split("/")[1];
    const storageKey = `media/${new Date().toISOString().slice(0, 10)}/${nanoid(12)}.${extension}`;
    const publicUrl = await this.s3.upload(storageKey, input.buffer, actualMimeType);

    return this.prisma.mediaAsset.create({
      data: {
        filename: storageKey.split("/").pop()!,
        originalFilename: input.originalFilename,
        mimeType: actualMimeType,
        size: input.buffer.length,
        width,
        height,
        storageKey,
        publicUrl,
        uploadedById: input.uploadedById,
      },
    });
  }

  list(params: { page: number; perPage: number; search?: string }) {
    return this.prisma.mediaAsset.findMany({
      where: params.search
        ? {
            OR: [
              { originalFilename: { contains: params.search, mode: "insensitive" } },
              { alt: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.perPage,
      take: params.perPage,
    });
  }

  async updateMetadata(id: string, data: { alt?: string; caption?: string }) {
    const media = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!media) throw new NotFoundException("Media asset not found");
    return this.prisma.mediaAsset.update({ where: { id }, data });
  }

  /** Checks every place a MediaAsset can be referenced before allowing deletion. */
  async checkReferences(id: string): Promise<string[]> {
    const [seoUses, blogCovers, authorAvatars, settingsUses, supplyAttachments] = await Promise.all([
      this.prisma.seoMetadata.count({ where: { ogImageId: id } }),
      this.prisma.blogPost.count({ where: { coverImageId: id } }),
      this.prisma.author.count({ where: { avatarMediaId: id } }),
      this.prisma.siteSettings.count({
        where: { OR: [{ logoMediaId: id }, { faviconMediaId: id }, { defaultOgImageId: id }] },
      }),
      this.prisma.supplyRequest.count({ where: { attachmentMediaId: id } }),
    ]);

    const references: string[] = [];
    if (seoUses > 0) references.push(`${seoUses} SEO metadata record(s)`);
    if (blogCovers > 0) references.push(`${blogCovers} blog post cover image(s)`);
    if (authorAvatars > 0) references.push(`${authorAvatars} author avatar(s)`);
    if (settingsUses > 0) references.push("site settings");
    if (supplyAttachments > 0) references.push(`${supplyAttachments} supply request attachment(s)`);
    // Page section content is free-form JSON, so referenced media inside it
    // can't be indexed with a SQL query — the admin UI additionally warns
    // the editor to check section content manually before deleting.
    return references;
  }

  async delete(id: string, force = false) {
    const media = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!media) throw new NotFoundException("Media asset not found");

    if (!force) {
      const references = await this.checkReferences(id);
      if (references.length > 0) {
        throw new ConflictException(
          `This file is still referenced by: ${references.join(", ")}. Remove those references first, or force delete.`,
        );
      }
    }

    await this.s3.delete(media.storageKey);
    await this.prisma.mediaAsset.delete({ where: { id } });
  }
}
