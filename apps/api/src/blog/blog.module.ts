import { Module } from "@nestjs/common";
import { BlogController } from "./blog.controller";
import { BlogService } from "./blog.service";
import { BlogSchedulerService } from "./blog-scheduler.service";
import { CategoriesController, TagsController, AuthorsController } from "./taxonomy.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [BlogController, CategoriesController, TagsController, AuthorsController],
  providers: [BlogService, BlogSchedulerService],
  exports: [BlogService],
})
export class BlogModule {}
