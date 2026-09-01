import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { SupplyRequestInput } from "@renas/validation";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SupplyRequestsService {
  private readonly logger = new Logger(SupplyRequestsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async submit(input: SupplyRequestInput) {
    if (input.honeypot) {
      // Bot detected via the hidden field — pretend success without
      // persisting or notifying anyone, so the bot gets no signal that
      // anything was rejected.
      this.logger.warn("Honeypot triggered on supply request submission");
      return { id: "00000000-0000-0000-0000-000000000000", accepted: true };
    }

    const record = await this.prisma.supplyRequest.create({
      data: {
        productName: input.productName,
        brand: input.brand,
        partNumber: input.partNumber,
        quantity: input.quantity,
        unit: input.unit,
        category: input.category,
        originPreference: input.originPreference,
        destination: input.destination,
        requiredBy: input.requiredBy ? new Date(input.requiredBy) : undefined,
        attachmentMediaId: input.attachmentMediaId,
        contactName: input.contactName,
        companyName: input.companyName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        contactChannel: input.contactChannel,
        message: input.message,
        source: input.source,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmContent: input.utmContent,
        utmTerm: input.utmTerm,
        referrer: input.referrer,
      },
    });

    return { id: record.id, accepted: true };
  }

  list(params: { page: number; perPage: number; status?: string; search?: string }) {
    const where = {
      ...(params.status ? { status: params.status as never } : {}),
      ...(params.search
        ? {
            OR: [
              { productName: { contains: params.search, mode: "insensitive" as const } },
              { contactName: { contains: params.search, mode: "insensitive" as const } },
              { companyName: { contains: params.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
    return Promise.all([
      this.prisma.supplyRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.perPage,
        take: params.perPage,
        include: { notes: { orderBy: { createdAt: "desc" } } },
      }),
      this.prisma.supplyRequest.count({ where }),
    ]).then(([items, total]) => ({ items, total }));
  }

  async get(id: string) {
    const request = await this.prisma.supplyRequest.findUnique({
      where: { id },
      include: { notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { id: true, name: true } } } }, attachment: true },
    });
    if (!request) throw new NotFoundException("Supply request not found");
    return request;
  }

  async updateStatus(id: string, status: string) {
    await this.get(id);
    return this.prisma.supplyRequest.update({ where: { id }, data: { status: status as never } });
  }

  async addNote(id: string, authorId: string, note: string) {
    await this.get(id);
    return this.prisma.supplyRequestNote.create({ data: { supplyRequestId: id, authorId, note } });
  }
}
