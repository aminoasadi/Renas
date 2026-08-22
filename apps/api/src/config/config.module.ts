import { Global, Module } from "@nestjs/common";
import { AppConfig } from "./config.service";

@Global()
@Module({
  providers: [AppConfig, { provide: "APP_CONFIG", useExisting: AppConfig }],
  exports: [AppConfig, "APP_CONFIG"],
})
export class ConfigModule {}
