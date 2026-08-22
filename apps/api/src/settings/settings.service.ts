import { Injectable } from "@nestjs/common";
import type { UpdateSiteSettingsInput } from "@renas/validation";
import { revalidationTags } from "@renas/shared";
import { PrismaService } from "../prisma/prisma.service";
import { RevalidationService } from "../content/revalidation.service";

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revalidation: RevalidationService,
  ) {}

  async get() {
    const existing = await this.prisma.siteSettings.findFirst();
    if (existing) return existing;
    return this.prisma.siteSettings.create({ data: { companyName: "RENAS Group" } });
  }

  async update(input: UpdateSiteSettingsInput) {
    const current = await this.get();
    const updated = await this.prisma.siteSettings.update({
      where: { id: current.id },
      data: input,
    });
    await this.revalidation.revalidateTags([revalidationTags.siteSettings()]);
    return updated;
  }
}
