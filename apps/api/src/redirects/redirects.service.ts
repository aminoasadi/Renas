import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateRedirectInput } from "@renas/validation";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RedirectsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.redirect.findMany({ orderBy: { createdAt: "desc" } });
  }

  async create(input: CreateRedirectInput) {
    this.assertNoLoop(input.sourcePath, input.destinationPath);
    return this.prisma.redirect.create({ data: input });
  }

  async update(id: string, input: Partial<CreateRedirectInput>) {
    const existing = await this.prisma.redirect.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Redirect not found");
    const destinationPath = input.destinationPath ?? existing.destinationPath;
    const sourcePath = input.sourcePath ?? existing.sourcePath;
    this.assertNoLoop(sourcePath, destinationPath);
    return this.prisma.redirect.update({ where: { id }, data: input });
  }

  async delete(id: string) {
    await this.prisma.redirect.delete({ where: { id } });
  }

  /** Finds the matching active redirect for an incoming path, resolving one hop only. */
  async resolve(path: string) {
    return this.prisma.redirect.findFirst({ where: { sourcePath: path, isActive: true } });
  }

  private assertNoLoop(sourcePath: string, destinationPath: string) {
    if (sourcePath === destinationPath) {
      throw new BadRequestException("Source and destination paths must differ");
    }
  }
}
