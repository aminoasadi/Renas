import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { MediaController } from "./media.controller";
import { MediaService } from "./media.service";
import { S3Service } from "./s3.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    AuthModule,
    MulterModule.register({
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService, S3Service],
  exports: [MediaService, S3Service],
})
export class MediaModule {}
