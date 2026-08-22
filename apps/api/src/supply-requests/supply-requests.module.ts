import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { SupplyRequestsController, PublicSupplyRequestsController } from "./supply-requests.controller";
import { SupplyRequestsService } from "./supply-requests.service";
import { AuthModule } from "../auth/auth.module";
import { MediaModule } from "../media/media.module";

@Module({
  imports: [AuthModule, MediaModule, MulterModule.register({ limits: { fileSize: 15 * 1024 * 1024 } })],
  controllers: [SupplyRequestsController, PublicSupplyRequestsController],
  providers: [SupplyRequestsService],
})
export class SupplyRequestsModule {}
