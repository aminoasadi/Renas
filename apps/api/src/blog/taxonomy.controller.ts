import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { createTaxonomySchema, createAuthorSchema } from "@renas/validation";
import { PrismaService } from "../prisma/prisma.service";
import { SessionAuthGuard } from "../common/guards/session-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("categories")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "EDITOR")
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.blogCategory.findMany({ orderBy: { name: "asc" } });
  }

  @Post()
  create(@Body() body: unknown) {
    const input = createTaxonomySchema.parse(body);
    return this.prisma.blogCategory.create({ data: input });
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.prisma.blogCategory.delete({ where: { id } });
    return { success: true };
  }
}

@Controller("tags")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "EDITOR")
export class TagsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.blogTag.findMany({ orderBy: { name: "asc" } });
  }

  @Post()
  create(@Body() body: unknown) {
    const input = createTaxonomySchema.parse(body);
    return this.prisma.blogTag.create({ data: input });
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.prisma.blogTag.delete({ where: { id } });
    return { success: true };
  }
}

@Controller("authors")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "EDITOR")
export class AuthorsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.author.findMany({ orderBy: { name: "asc" } });
  }

  @Post()
  create(@Body() body: unknown) {
    const input = createAuthorSchema.parse(body);
    return this.prisma.author.create({ data: input });
  }
}
