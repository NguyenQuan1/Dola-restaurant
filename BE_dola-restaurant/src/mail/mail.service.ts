import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

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
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getTransporter(): nodemailer.Transporter {
    if (this.transporter) return this.transporter;

    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');
    const host = this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com');
    const port = Number(this.configService.get<number>('MAIL_PORT', 587));
    const secure = port === 465;

    if (!user || !pass) {
      this.logger.warn(
        'Chưa cấu hình MAIL_USER hoặc MAIL_PASS trong biến môi trường!',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      // Ép socket chỉ kết nối qua IPv4 để tránh ENETUNREACH / ETIMEDOUT trên Railway
      family: 4,
      tls: {
        rejectUnauthorized: false,
      },
    } as any);

    return this.transporter;
  }

  async send(options: SendMailOptions): Promise<void> {
    const transporter = this.getTransporter();
    const from =
      this.configService.get<string>('MAIL_FROM') ||
      this.configService.get<string>('MAIL_USER') ||
      'Dola Restaurant';

    const mailOptions: nodemailer.SendMailOptions = {
      from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
    };

    if (options.text) {
      mailOptions.text = options.text;
    }
    if (options.html) {
      mailOptions.html = options.html;
    }
    if (options.bcc && options.bcc.length > 0) {
      mailOptions.bcc = options.bcc;
    }

    try {
      await transporter.sendMail(mailOptions);
    } catch (error: any) {
      this.logger.error(`Lỗi gửi mail qua Nodemailer: ${error?.message || error}`);
      throw error;
    }
  }
}

