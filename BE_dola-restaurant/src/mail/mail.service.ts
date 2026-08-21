import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

  constructor(private readonly configService: ConfigService) {}

  private parseSender(): { name: string; email: string } {
    const rawFrom = this.configService.get<string>('MAIL_FROM');
    const defaultEmail =
      this.configService.get<string>('BREVO_SENDER_EMAIL') ||
      this.configService.get<string>('MAIL_USER') ||
      'quantanlong001@gmail.com';

    if (!rawFrom) {
      return { name: 'Dola Restaurant', email: defaultEmail };
    }

    const match = rawFrom.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
    if (match) {
      const name = match[1]?.trim() || 'Dola Restaurant';
      const email = match[2]?.trim() || defaultEmail;
      return { name, email };
    }

    return { name: 'Dola Restaurant', email: rawFrom };
  }

  async send(options: SendMailOptions): Promise<void> {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    if (!apiKey) {
      this.logger.error('Thiếu BREVO_API_KEY trong biến môi trường!');
      throw new Error('Chưa cấu hình BREVO_API_KEY trong biến môi trường.');
    }

    const sender = this.parseSender();

    const toList = (Array.isArray(options.to) ? options.to : [options.to])
      .map((email) => email?.trim())
      .filter((email): email is string => Boolean(email))
      .map((email) => ({ email }));

    if (toList.length === 0) {
      throw new Error('Không có địa chỉ email người nhận (to) hợp lệ.');
    }

    const payload: Record<string, any> = {
      sender,
      to: toList,
      subject: options.subject,
    };

    if (options.html) {
      payload.htmlContent = options.html;
    }
    if (options.text) {
      payload.textContent = options.text;
    }
    if (!options.html && !options.text) {
      payload.textContent = '';
    }

    if (options.bcc && options.bcc.length > 0) {
      payload.bcc = options.bcc
        .map((email) => email?.trim())
        .filter((email): email is string => Boolean(email))
        .map((email) => ({ email }));
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey.trim(),
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errMessage = `HTTP ${response.status} ${response.statusText}`;
        try {
          const errData = await response.json();
          errMessage = errData?.message || JSON.stringify(errData);
        } catch {
          // fallback to status text
        }
        throw new Error(`Brevo API lỗi: ${errMessage}`);
      }
    } catch (error: any) {
      this.logger.error(`Lỗi gửi mail qua Brevo API: ${error?.message || error}`);
      throw error;
    }
  }
}


