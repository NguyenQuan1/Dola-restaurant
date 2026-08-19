"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPromotionMailText = buildPromotionMailText;
exports.buildPromotionMailHtml = buildPromotionMailHtml;
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function nl2br(value) {
    return escapeHtml(value).replace(/\n/g, '<br />');
}
function formatPromotionDate(dateStr) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime()))
        return dateStr;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatPromotionValue(promotion) {
    return promotion.discountType === 'percent'
        ? `${Number(promotion.discountValue)}%`
        : `${Number(promotion.discountValue).toLocaleString('vi-VN')}đ`;
}
function buildPromotionMailText(promotion) {
    const value = formatPromotionValue(promotion);
    const timeRange = promotion.startTime && promotion.endTime
        ? ` (khung giờ ${promotion.startTime} - ${promotion.endTime})`
        : '';
    return [
        `Dola Restaurant vừa bắt đầu chương trình khuyến mãi: ${promotion.title}`,
        `Loại: ${promotion.type}`,
        `Ưu đãi: ${value}`,
        promotion.code ? `Mã ưu đãi: ${promotion.code}` : '',
        `Thời gian áp dụng: từ ${promotion.startDate} đến ${promotion.endDate}${timeRange}`,
        promotion.description ? `Chi tiết: ${promotion.description}` : '',
        promotion.conditions ? `Điều kiện áp dụng: ${promotion.conditions}` : '',
        'Ghé Dola Restaurant ngay hôm nay để không bỏ lỡ ưu đãi này!',
    ]
        .filter(Boolean)
        .join('\n');
}
function buildPromotionMailHtml(promotion, ctaUrl = '#') {
    const title = escapeHtml(promotion.title);
    const type = escapeHtml(promotion.type);
    const value = formatPromotionValue(promotion);
    const startDate = formatPromotionDate(promotion.startDate);
    const endDate = formatPromotionDate(promotion.endDate);
    const timeRange = promotion.startTime && promotion.endTime
        ? `${promotion.startTime.slice(0, 5)} - ${promotion.endTime.slice(0, 5)}`
        : null;
    const descriptionBlock = promotion.description
        ? `
        <tr>
          <td style="padding:0 32px 4px 32px;">
            <p style="margin:0 0 6px 0;font-size:13px;font-weight:700;color:#B45309;text-transform:uppercase;letter-spacing:.04em;">
              Chi tiết chương trình
            </p>
            <p style="margin:0;font-size:15px;line-height:1.6;color:#3F3A36;">
              ${nl2br(promotion.description)}
            </p>
          </td>
        </tr>`
        : '';
    const conditionsBlock = promotion.conditions
        ? `
        <tr>
          <td style="padding:20px 32px 0 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF8ED;border:1px solid #F3E3C6;border-radius:10px;">
              <tr>
                <td style="padding:16px 18px;">
                  <p style="margin:0 0 6px 0;font-size:13px;font-weight:700;color:#B45309;text-transform:uppercase;letter-spacing:.04em;">
                    Điều kiện áp dụng
                  </p>
                  <p style="margin:0;font-size:14px;line-height:1.6;color:#5B5551;">
                    ${nl2br(promotion.conditions)}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
        : '';
    const timeRow = timeRange
        ? `
              <tr>
                <td style="padding-top:6px;font-size:14px;color:#6B6560;">
                  ⏰ Khung giờ áp dụng trong ngày: <strong style="color:#3F3A36;">${timeRange}</strong>
                </td>
              </tr>`
        : '';
    const codeBlock = promotion.code
        ? `
        <tr>
          <td style="padding:16px 32px 0 32px;text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="border:1.5px dashed #C99A4B;border-radius:999px;padding:8px 20px;background-color:#FFFDF8;">
                  <span style="font-size:11px;color:#9C8354;text-transform:uppercase;letter-spacing:.06em;margin-right:6px;">Mã ưu đãi</span>
                  <span style="font-size:15px;font-weight:800;letter-spacing:.05em;color:#B45309;">${escapeHtml(promotion.code)}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
        : '';
    return `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#F4EFE9;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4EFE9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.06);">

            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#D97706,#EA9A3E);padding:28px 32px;text-align:center;">
                <p style="margin:0;font-size:13px;letter-spacing:.14em;color:#FFF3E0;text-transform:uppercase;font-weight:700;">
                  Dola Restaurant
                </p>
                <h1 style="margin:8px 0 0 0;font-size:24px;line-height:1.3;color:#FFFFFF;font-weight:800;">
                  🎉 Ưu đãi mới dành cho bạn!
                </h1>
              </td>
            </tr>

            <!-- Discount badge -->
            <tr>
              <td style="padding:28px 32px 4px 32px;text-align:center;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                  <tr>
                    <td style="background-color:#FDECC8;border-radius:999px;padding:10px 24px;">
                      <span style="font-size:26px;font-weight:800;color:#B45309;">Giảm ${value}</span>
                    </td>
                  </tr>
                </table>
                <span style="display:inline-block;margin-top:12px;background-color:#0F766E1A;color:#0F766E;font-size:12px;font-weight:700;padding:4px 12px;border-radius:999px;">
                  ${type}
                </span>
              </td>
            </tr>

            <!-- Title -->
            <tr>
              <td style="padding:12px 32px 0 32px;text-align:center;">
                <h2 style="margin:0;font-size:20px;color:#1F2937;font-weight:800;">${title}</h2>
              </td>
            </tr>

            ${codeBlock}

            <!-- Time range -->
            <tr>
              <td style="padding:18px 32px 0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF9;border-radius:10px;">
                  <tr>
                    <td style="padding:14px 18px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="font-size:14px;color:#6B6560;">
                            📅 Thời gian áp dụng: <strong style="color:#3F3A36;">${startDate} → ${endDate}</strong>
                          </td>
                        </tr>
                        ${timeRow}
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            ${descriptionBlock}
            ${conditionsBlock}

            <!-- CTA -->
            <tr>
              <td style="padding:28px 32px 8px 32px;text-align:center;">
                <a href="${ctaUrl}" style="display:inline-block;background-color:#1F2937;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:700;padding:13px 32px;border-radius:10px;">
                  Đặt bàn ngay
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:8px 32px 28px 32px;text-align:center;">
                <p style="margin:0;font-size:13px;color:#9C9691;">
                  Ghé Dola Restaurant ngay hôm nay để không bỏ lỡ ưu đãi này!
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#FAFAF9;padding:20px 32px;text-align:center;border-top:1px solid #F0EBE5;">
                <p style="margin:0;font-size:12px;color:#A8A29B;">
                  Bạn nhận được email này vì là khách hàng của Dola Restaurant.<br />
                  © ${new Date().getFullYear()} Dola Restaurant. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
//# sourceMappingURL=promotion-mail.template.js.map