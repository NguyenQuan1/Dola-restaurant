import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  bcc?: string[];
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private client: Resend | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getClient(): Resend {
    if (this.client) return this.client;

    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error(
        'Thiếu RESEND_API_KEY trong biến môi trường. Truy cập resend.com để lấy API key.',
      );
    }

    this.client = new Resend(apiKey);
    return this.client;
  }

  async send(options: SendMailOptions): Promise<void> {
    const client = this.getClient();
    const from =
      this.configService.get<string>('MAIL_FROM') ||
      'Dola Restaurant <onboarding@resend.dev>';

    const { error } = await client.emails.send({
      from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      ...(options.text ? { text: options.text } : {}),
      ...(options.html ? { html: options.html } : {}),
      ...(options.bcc && options.bcc.length > 0 ? { bcc: options.bcc } : {}),
    });

    if (error) {
      throw new Error(`Resend API lỗi: ${error.message}`);
    }
  }
}
