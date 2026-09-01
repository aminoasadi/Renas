import { Injectable, NotFoundException } from "@nestjs/common";
import * as argon2 from "argon2";
import type { CreateUserInput, UpdateUserInput } from "@renas/validation";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  }

  async create(input: CreateUserInput) {
    const { password, ...rest } = input;
    return this.prisma.user.create({ data: { ...rest, passwordHash: await argon2.hash(password) } });
  }

  async update(id: string, input: UpdateUserInput) {
    await this.ensureExists(id);
    return this.prisma.user.update({ where: { id }, data: input });
  }

  async resetPassword(id: string, password: string) {
    await this.ensureExists(id);
    return this.prisma.user.update({ where: { id }, data: { passwordHash: await argon2.hash(password) } });
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
