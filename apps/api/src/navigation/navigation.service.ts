import { Injectable } from "@nestjs/common";
import type { NavigationKey } from "@renas/database";
import type { UpdateNavigationInput } from "@renas/validation";
import { PrismaService } from "../prisma/prisma.service";
import { RevalidationService } from "../content/revalidation.service";
import { revalidationTags } from "@renas/shared";

@Injectable()
export class NavigationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revalidation: RevalidationService,
  ) {}

  /** Every item across every locale — the caller (admin UI) filters by locale client-side. */
  async get(key: NavigationKey) {
    const nav = await this.prisma.navigation.upsert({
      where: { key },
      create: { key },
      update: {},
      include: { items: { orderBy: [{ locale: "asc" }, { position: "asc" }] } },
    });
    return nav;
  }

  /** Public: one locale's items only, in position order. */
  async getForLocale(key: NavigationKey, locale: string) {
    const nav = await this.get(key);
    return { ...nav, items: nav.items.filter((item) => item.locale === locale) };
  }

  /** Replaces only the given locale's items — the other locale's rows are untouched. */
  async update(key: NavigationKey, locale: string, input: UpdateNavigationInput) {
    const nav = await this.get(key);

    await this.prisma.$transaction([
      this.prisma.navigationItem.deleteMany({ where: { navigationId: nav.id, locale } }),
      this.prisma.navigationItem.createMany({
        data: input.items.map((item, index) => ({
          navigationId: nav.id,
          locale,
          label: item.label,
          url: item.url,
          isExternal: item.isExternal,
          target: item.target,
          isVisible: item.isVisible,
          position: index,
        })),
      }),
    ]);

    await this.revalidation.revalidateTags([revalidationTags.navigation()]);
    return this.get(key);
  }
}
