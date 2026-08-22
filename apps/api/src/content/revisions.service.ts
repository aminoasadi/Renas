import { Injectable } from "@nestjs/common";
import type { RevisionEntityType } from "@renas/database";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Generic revision history, shared by Page and BlogPost. A revision is
 * written exactly once per publish (or restore-that-republishes) — it is
 * the audit trail `publishedSnapshot` alone can't provide, since that field
 * only ever holds the CURRENT live version.
 */
@Injectable()
export class RevisionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRevision(params: {
    entityType: RevisionEntityType;
    entityId: string;
    snapshot: unknown;
    editorId?: string | null;
  }) {
    const latest = await this.prisma.contentRevision.findFirst({
      where: { entityType: params.entityType, entityId: params.entityId },
      orderBy: { version: "desc" },
    });
    const version = (latest?.version ?? 0) + 1;

    return this.prisma.contentRevision.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        version,
        snapshot: params.snapshot as never,
        editorId: params.editorId ?? null,
      },
    });
  }

  listRevisions(entityType: RevisionEntityType, entityId: string) {
    return this.prisma.contentRevision.findMany({
      where: { entityType, entityId },
      orderBy: { version: "desc" },
      include: { editor: { select: { id: true, name: true, email: true } } },
    });
  }

  getRevision(entityType: RevisionEntityType, entityId: string, version: number) {
    return this.prisma.contentRevision.findUnique({
      where: { entityType_entityId_version: { entityType, entityId, version } },
    });
  }
}
