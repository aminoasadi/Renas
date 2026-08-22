import { Global, Module } from "@nestjs/common";
import { RevisionsService } from "./revisions.service";
import { RevalidationService } from "./revalidation.service";
import { PreviewService } from "./preview.service";

@Global()
@Module({
  providers: [RevisionsService, RevalidationService, PreviewService],
  exports: [RevisionsService, RevalidationService, PreviewService],
})
export class ContentModule {}
