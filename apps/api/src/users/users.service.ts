import { Injectable, NotFoundException } from "@nestjs/common";
import type { CreateUserInput, UpdateUserInput } from "@renas/validation";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  }

  async create(input: CreateUserInput) {
    return this.prisma.user.create({ data: input });
  }

  async update(id: string, input: UpdateUserInput) {
    await this.ensureExists(id);
    return this.prisma.user.update({ where: { id }, data: input });
  }

  async setStatus(id: string, status: "ACTIVE" | "DISABLED") {
    await this.ensureExists(id);
    return this.prisma.user.update({ where: { id }, data: { status } });
  }

  private async ensureExists(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }
}
