import { Injectable, Logger } from "@nestjs/common";
import { createTransport, type Transporter } from "nodemailer";
import { AppConfig } from "../config/config.service";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * The only place that knows about SMTP/nodemailer. Every caller in the app
 * goes through `send()` — swapping providers later (SES, Postmark, whatever)
 * means changing this one file, not every module that happens to send mail.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;

  constructor(private readonly config: AppConfig) {
    const smtp = this.config.smtp;
    this.transporter = createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.user ? { user: smtp.user, pass: smtp.password } : undefined,
    });
  }

  async send(input: SendEmailInput): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.config.smtp.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });
    } catch (error) {
      // Email failures must never take down the caller's primary operation
      // (an RFQ save, an OTP request) — log loudly and let the caller decide
      // whether/how to retry, per the "persist first, notify second, retry
      // safely" requirement.
      this.logger.error(`Failed to send email to ${input.to}: ${(error as Error).message}`);
      throw error;
    }
  }
}
