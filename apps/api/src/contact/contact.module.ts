import { Module } from "@nestjs/common";
import { ContactController, PublicContactController } from "./contact.controller";
import { ContactService } from "./contact.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [ContactController, PublicContactController],
  providers: [ContactService],
})
export class ContactModule {}
