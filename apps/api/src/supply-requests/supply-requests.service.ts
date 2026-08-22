import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { SupplyRequestInput } from "@renas/validation";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { AppConfig } from "../config/config.service";
import { rfqConfirmationTemplate, rfqInternalNotificationTemplate } from "../email/templates";

@Injectable()
export class SupplyRequestsService {
  private readonly logger = new Logger(SupplyRequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly config: AppConfig,
  ) {}

  /**
   * Persist first, notify second — a submission is never lost just because
   * an email happened to fail. Notification failures are logged, not
   * thrown, so the public-facing response still reports success once the
   * database write (the part that actually matters) has succeeded.
   */
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

    await this.notifyTeam(record).catch((error) =>
      this.logger.error(`Failed to send internal RFQ notification for ${record.id}: ${error.message}`),
    );

    if (record.contactEmail) {
      await this.notifyRequester(record).catch((error) =>
        this.logger.error(`Failed to send RFQ confirmation for ${record.id}: ${error.message}`),
      );
    }

    return { id: record.id, accepted: true };
  }

  private async notifyTeam(record: { id: string; productName: string; contactName: string; companyName: string | null; contactEmail: string | null; contactPhone: string | null }) {
    const template = rfqInternalNotificationTemplate(record);
    await this.email.send({ to: this.config.notificationsTeamEmail, subject: template.subject, html: template.html });
  }

  private async notifyRequester(record: { contactEmail: string | null; contactName: string; productName: string }) {
    if (!record.contactEmail) return;
    const template = rfqConfirmationTemplate(record);
    await this.email.send({ to: record.contactEmail, subject: template.subject, html: template.html });
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
