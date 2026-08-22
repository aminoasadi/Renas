import { Module } from "@nestjs/common";
import { RedirectsController, PublicRedirectsController } from "./redirects.controller";
import { RedirectsService } from "./redirects.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [RedirectsController, PublicRedirectsController],
  providers: [RedirectsService],
})
export class RedirectsModule {}
