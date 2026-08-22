import { Module } from "@nestjs/common";
import { AuditLogsController, DashboardController } from "./audit-logs.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [AuditLogsController, DashboardController],
})
export class AuditLogsModule {}
