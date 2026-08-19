"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildReservationConfirmedMailText = buildReservationConfirmedMailText;
exports.buildReservationCancelledMailText = buildReservationCancelledMailText;
exports.buildReservationReminderMailText = buildReservationReminderMailText;
exports.buildReservationConfirmedMailHtml = buildReservationConfirmedMailHtml;
exports.buildReservationCancelledMailHtml = buildReservationCancelledMailHtml;
exports.buildReservationReminderMailHtml = buildReservationReminderMailHtml;
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
function formatReservationDate(dateStr) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime()))
        return dateStr;
    return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatReservationTime(timeStr) {
    return timeStr?.slice(0, 5) || timeStr;
}
function buildReservationConfirmedMailText(data) {
    return [
        `Xin chào ${data.customerName},`,
        `Dola Restaurant xác nhận đặt bàn của bạn:`,
        `Ngày: ${data.reservationDate}`,
        `Giờ: ${formatReservationTime(data.reservationTime)}`,
        `Số người: ${data.partySize}`,
        data.tableNumber ? `Bàn số: ${data.tableNumber}` : '',
        `Điện thoại: ${data.phone}`,
        data.note ? `Yêu cầu đặc biệt: ${data.note}` : '',
        'Rất mong được đón tiếp bạn tại Dola Restaurant!',
    ]
        .filter(Boolean)
        .join('\n');
}
function buildReservationCancelledMailText(data) {
    return [
        `Xin chào ${data.customerName},`,
        `Đặt bàn của bạn tại Dola Restaurant đã bị huỷ:`,
        `Ngày: ${data.reservationDate}`,
        `Giờ: ${formatReservationTime(data.reservationTime)}`,
        `Số người: ${data.partySize}`,
        `Lý do huỷ: ${data.cancelReason || 'Không có ghi chú'}`,
        'Rất xin lỗi vì sự bất tiện này. Vui lòng liên hệ nhà hàng nếu bạn cần hỗ trợ đặt lại.',
    ]
        .filter(Boolean)
        .join('\n');
}
function buildReservationReminderMailText(data) {
    return [
        `Xin chào ${data.customerName},`,
        `Dola Restaurant xin nhắc bạn lịch đặt bàn sắp diễn ra (sau 4 giờ tới):`,
        `Ngày: ${data.reservationDate}`,
        `Giờ: ${formatReservationTime(data.reservationTime)}`,
        `Số người: ${data.partySize}`,
        data.tableNumber ? `Bàn số: ${data.tableNumber}` : '',
        `Điện thoại: ${data.phone}`,
        data.note ? `Yêu cầu đặc biệt: ${data.note}` : '',
        'Vui lòng đến đúng giờ để nhà hàng có thể phục vụ tốt nhất. Trân trọng!',
    ]
        .filter(Boolean)
        .join('\n');
}
function baseWrapper(headerColor, headerEmoji, headerTitle, bodyContent) {
    return `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${headerTitle}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#F4EFE9;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4EFE9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.06);">

            <tr>
              <td style="background:${headerColor};padding:28px 32px;text-align:center;">
                <p style="margin:0;font-size:13px;letter-spacing:.14em;color:#FFF3E0;text-transform:uppercase;font-weight:700;">
                  Dola Restaurant
                </p>
                <h1 style="margin:8px 0 0 0;font-size:24px;line-height:1.3;color:#FFFFFF;font-weight:800;">
                  ${headerEmoji} ${headerTitle}
                </h1>
              </td>
            </tr>

            ${bodyContent}

            <tr>
              <td style="background-color:#FAFAF9;padding:20px 32px;text-align:center;border-top:1px solid #F0EBE5;">
                <p style="margin:0;font-size:12px;color:#A8A29B;">
                  Mọi thắc mắc vui lòng liên hệ trực tiếp Dola Restaurant.<br />
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
function reservationInfoTable(data) {
    const date = formatReservationDate(data.reservationDate);
    const time = formatReservationTime(data.reservationTime);
    const tableRow = data.tableNumber
        ? `
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#6B6560;width:120px;">Bàn số</td>
          <td style="padding:6px 0;font-size:14px;font-weight:700;color:#3F3A36;">${escapeHtml(data.tableNumber)}</td>
        </tr>`
        : '';
    const noteRow = data.note
        ? `
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#6B6560;vertical-align:top;">Yêu cầu</td>
          <td style="padding:6px 0;font-size:14px;color:#3F3A36;">${nl2br(data.note)}</td>
        </tr>`
        : '';
    return `
        <tr>
          <td style="padding:20px 32px 0 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF9;border-radius:10px;">
              <tr>
                <td style="padding:16px 20px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#6B6560;width:120px;">Khách hàng</td>
                      <td style="padding:6px 0;font-size:14px;font-weight:700;color:#3F3A36;">${escapeHtml(data.customerName)}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#6B6560;">Điện thoại</td>
                      <td style="padding:6px 0;font-size:14px;color:#3F3A36;">${escapeHtml(data.phone)}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#6B6560;">Ngày</td>
                      <td style="padding:6px 0;font-size:14px;font-weight:700;color:#3F3A36;">${date}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#6B6560;">Giờ</td>
                      <td style="padding:6px 0;font-size:14px;font-weight:700;color:#3F3A36;">${time}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#6B6560;">Số người</td>
                      <td style="padding:6px 0;font-size:14px;color:#3F3A36;">${data.partySize}</td>
                    </tr>
                    ${tableRow}
                    ${noteRow}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
}
function buildReservationConfirmedMailHtml(data) {
    const body = `
            <tr>
              <td style="padding:24px 32px 0 32px;text-align:center;">
                <p style="margin:0;font-size:15px;color:#5B5551;">
                  Xin chào <strong style="color:#1F2937;">${escapeHtml(data.customerName)}</strong>, đặt bàn của bạn đã được xác nhận.
                </p>
              </td>
            </tr>
            ${reservationInfoTable(data)}
            <tr>
              <td style="padding:24px 32px 8px 32px;text-align:center;">
                <p style="margin:0;font-size:13px;color:#9C9691;">
                  Vui lòng đến đúng giờ. Nếu cần thay đổi lịch, hãy liên hệ nhà hàng sớm nhất có thể.
                </p>
              </td>
            </tr>`;
    return baseWrapper('linear-gradient(135deg,#0F766E,#14B8A6)', '✅', 'Đặt bàn đã được xác nhận', body);
}
function buildReservationCancelledMailHtml(data) {
    const reasonBlock = `
        <tr>
          <td style="padding:16px 32px 0 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FDECEC;border:1px solid #F5C6C6;border-radius:10px;">
              <tr>
                <td style="padding:14px 18px;">
                  <p style="margin:0 0 4px 0;font-size:13px;font-weight:700;color:#B42318;text-transform:uppercase;letter-spacing:.04em;">
                    Lý do huỷ
                  </p>
                  <p style="margin:0;font-size:14px;line-height:1.6;color:#5B5551;">
                    ${nl2br(data.cancelReason || 'Không có ghi chú')}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    const body = `
            <tr>
              <td style="padding:24px 32px 0 32px;text-align:center;">
                <p style="margin:0;font-size:15px;color:#5B5551;">
                  Xin chào <strong style="color:#1F2937;">${escapeHtml(data.customerName)}</strong>, rất tiếc đặt bàn dưới đây đã bị huỷ.
                </p>
              </td>
            </tr>
            ${reservationInfoTable(data)}
            ${reasonBlock}
            <tr>
              <td style="padding:24px 32px 8px 32px;text-align:center;">
                <p style="margin:0;font-size:13px;color:#9C9691;">
                  Xin lỗi vì sự bất tiện này. Vui lòng liên hệ nhà hàng nếu bạn muốn đặt lại lịch khác.
                </p>
              </td>
            </tr>`;
    return baseWrapper('linear-gradient(135deg,#B42318,#E05252)', '❌', 'Đặt bàn đã bị huỷ', body);
}
function buildReservationReminderMailHtml(data) {
    const body = `
            <tr>
              <td style="padding:24px 32px 0 32px;text-align:center;">
                <p style="margin:0;font-size:15px;color:#5B5551;">
                  Xin chào <strong style="color:#1F2937;">${escapeHtml(data.customerName)}</strong>, Dola Restaurant xin nhắc bạn lịch đặt bàn sắp diễn ra trong 4 giờ tới.
                </p>
              </td>
            </tr>
            ${reservationInfoTable(data)}
            <tr>
              <td style="padding:24px 32px 8px 32px;text-align:center;">
                <p style="margin:0;font-size:13px;color:#9C9691;">
                  Vui lòng đến đúng giờ để được phục vụ tốt nhất. Nếu cần hỗ trợ hoặc thay đổi lịch, hãy gọi hotline nhà hàng!
                </p>
              </td>
            </tr>`;
    return baseWrapper('linear-gradient(135deg,#D97706,#F59E0B)', '⏰', 'Nhắc nhở lịch đặt bàn', body);
}
//# sourceMappingURL=reservation-mail.template.js.map