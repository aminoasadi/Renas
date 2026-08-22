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

  async get(key: NavigationKey) {
    const nav = await this.prisma.navigation.upsert({
      where: { key },
      create: { key },
      update: {},
      include: { items: { orderBy: { position: "asc" } } },
    });
    return nav;
  }

  async update(key: NavigationKey, input: UpdateNavigationInput) {
    const nav = await this.get(key);

    await this.prisma.$transaction([
      this.prisma.navigationItem.deleteMany({ where: { navigationId: nav.id } }),
      this.prisma.navigationItem.createMany({
        data: input.items.map((item, index) => ({
          navigationId: nav.id,
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
