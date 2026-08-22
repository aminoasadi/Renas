import { Module } from "@nestjs/common";
import { NavigationController } from "./navigation.controller";
import { NavigationService } from "./navigation.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [NavigationController],
  providers: [NavigationService],
  exports: [NavigationService],
})
export class NavigationModule {}
