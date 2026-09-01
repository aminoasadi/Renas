import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { SessionService } from "./session.service";
import { SessionAuthGuard } from "../common/guards/session-auth.guard";

@Module({
  controllers: [AuthController],
  providers: [SessionService, SessionAuthGuard],
  exports: [SessionService, SessionAuthGuard],
})
export class AuthModule {}
