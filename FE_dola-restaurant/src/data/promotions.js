export const promoGroups = [
  {
    type: 'Voucher',
    items: [
      {
        code: 'DOLA50K',
        title: 'Giảm 50.000đ cho đơn từ 200.000đ',
        desc: 'Áp dụng cho tất cả hóa đơn ăn tại quán hoặc đặt món online.',
        expiry: '31/08/2026',
      },
      {
        code: 'NEWMEM',
        title: 'Giảm 15% cho khách hàng mới',
        desc: 'Dành cho lần đặt hàng đầu tiên khi đăng ký thành viên Dola.',
        expiry: '31/12/2026',
      },
    ],
  },
  {
    type: 'Combo',
    items: [
      {
        code: 'COMBO-GD',
        title: 'Combo Gia Đình',
        desc: '4 món chính + 2 tráng miệng, giảm ngay 20% cho nhóm từ 4 người.',
        expiry: 'Áp dụng hằng ngày',
      },
      {
        code: 'COMBO-DOI',
        title: 'Combo Đôi Bạn',
        desc: '2 món chính + 2 đồ uống, chỉ từ 129.000đ.',
        expiry: 'Áp dụng hằng ngày',
      },
    ],
  },
  {
    type: 'Flash Sale',
    items: [
      {
        code: 'FLASH12H',
        title: 'Flash Sale khung giờ trưa 11h - 13h',
        desc: 'Giảm 25% toàn bộ món cơm và bún trong khung giờ vàng.',
        expiry: 'Mỗi ngày, số lượng có hạn',
      },
    ],
  },
  {
    type: 'Cuối tuần',
    items: [
      {
        code: 'WEEKEND',
        title: 'Ưu đãi cuối tuần',
        desc: 'Tặng 1 chè hạt sen cho mỗi hóa đơn từ 300.000đ vào Thứ 7 & Chủ nhật.',
        expiry: 'Thứ 7 - Chủ nhật hằng tuần',
      },
    ],
  },
]

export const voucherCodes = {
  DOLA50K: { type: 'fixed', value: 50000 },
  NEWMEM: { type: 'percent', value: 15 },
  FLASH12H: { type: 'percent', value: 25 },
}
