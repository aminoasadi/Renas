import { Injectable } from "@nestjs/common";
import type { UpdateFaqItemsInput } from "@renas/validation";
import { PrismaService } from "../prisma/prisma.service";
import { RevalidationService } from "../content/revalidation.service";
import { revalidationTags } from "@renas/shared";

@Injectable()
export class FaqService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revalidation: RevalidationService,
  ) {}

  list(locale = "en") {
    return this.prisma.faqItem.findMany({ where: { locale }, orderBy: { position: "asc" } });
  }

  listVisible(locale = "en") {
    return this.prisma.faqItem.findMany({
      where: { locale, isVisible: true },
      orderBy: { position: "asc" },
    });
  }

  /** Replaces only the given locale's items — the other locale's list is untouched. */
  async replaceAll(locale: string, input: UpdateFaqItemsInput) {
    await this.prisma.$transaction([
      this.prisma.faqItem.deleteMany({ where: { locale } }),
      this.prisma.faqItem.createMany({
        data: input.items.map((item, index) => ({
          question: item.question,
          answer: item.answer,
          isVisible: item.isVisible,
          locale,
          position: index,
        })),
      }),
    ]);

    await this.revalidation.revalidateTags([revalidationTags.faqList()]);
    return this.list(locale);
  }
}
