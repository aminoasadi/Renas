import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { ContactSubmissionInput } from "@renas/validation";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { AppConfig } from "../config/config.service";
import { contactNotificationTemplate } from "../email/templates";

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly config: AppConfig,
  ) {}

  async submit(input: ContactSubmissionInput) {
    if (input.honeypot) {
      this.logger.warn("Honeypot triggered on contact form submission");
      return { id: "00000000-0000-0000-0000-000000000000", accepted: true };
    }

    const record = await this.prisma.contactSubmission.create({
      data: {
        name: input.name,
        company: input.company,
        email: input.email,
        phone: input.phone,
        subject: input.subject,
        message: input.message,
      },
    });

    const template = contactNotificationTemplate(record);
    await this.email
      .send({ to: this.config.notificationsTeamEmail, subject: template.subject, html: template.html })
      .catch((error) => this.logger.error(`Failed to send contact notification for ${record.id}: ${error.message}`));

    return { id: record.id, accepted: true };
  }

  list(params: { page: number; perPage: number; status?: string }) {
    const where = params.status ? { status: params.status as never } : {};
    return Promise.all([
      this.prisma.contactSubmission.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.perPage,
        take: params.perPage,
      }),
      this.prisma.contactSubmission.count({ where }),
    ]).then(([items, total]) => ({ items, total }));
  }

  async get(id: string) {
    const submission = await this.prisma.contactSubmission.findUnique({ where: { id } });
    if (!submission) throw new NotFoundException("Contact submission not found");
    return submission;
  }

  async updateStatus(id: string, status: string) {
    await this.get(id);
    return this.prisma.contactSubmission.update({ where: { id }, data: { status: status as never } });
  }
}
