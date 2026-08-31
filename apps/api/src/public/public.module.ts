import { Module } from "@nestjs/common";
import { PublicController, InternalController } from "./public.controller";
import { PagesModule } from "../pages/pages.module";
import { NavigationModule } from "../navigation/navigation.module";
import { SettingsModule } from "../settings/settings.module";
import { BlogModule } from "../blog/blog.module";
import { FaqModule } from "../faq/faq.module";

@Module({
  imports: [PagesModule, NavigationModule, SettingsModule, BlogModule, FaqModule],
  controllers: [PublicController, InternalController],
})
export class PublicModule {}
