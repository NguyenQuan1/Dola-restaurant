// Dữ liệu mẫu — sẽ được thay bằng API thật ở Phần 2 (NestJS + MySQL)

export const categories = [
  { id: 1, name: 'Phở', foodCount: 6, active: true },
  { id: 2, name: 'Bún', foodCount: 5, active: true },
  { id: 3, name: 'Cơm tấm', foodCount: 4, active: true },
  { id: 4, name: 'Khai vị', foodCount: 8, active: true },
  { id: 5, name: 'Nước uống', foodCount: 10, active: true },
  { id: 6, name: 'Tráng miệng', foodCount: 3, active: false },
]

export const foods = [
  { id: 1, name: 'Phở bò tái nạm', category: 'Phở', price: 65000, sold: 482, active: true, image: null },
  { id: 2, name: 'Phở gà', category: 'Phở', price: 55000, sold: 310, active: true, image: null },
  { id: 3, name: 'Bún chả Hà Nội', category: 'Bún', price: 60000, sold: 275, active: true, image: null },
  { id: 4, name: 'Bún bò Huế', category: 'Bún', price: 62000, sold: 198, active: true, image: null },
  { id: 5, name: 'Cơm tấm sườn bì chả', category: 'Cơm tấm', price: 58000, sold: 412, active: true, image: null },
  { id: 6, name: 'Cơm tấm sườn nướng', category: 'Cơm tấm', price: 50000, sold: 226, active: true, image: null },
  { id: 7, name: 'Chả giò hải sản', category: 'Khai vị', price: 45000, sold: 150, active: true, image: null },
  { id: 8, name: 'Gỏi cuốn tôm thịt', category: 'Khai vị', price: 40000, sold: 132, active: false, image: null },
  { id: 9, name: 'Trà đá', category: 'Nước uống', price: 5000, sold: 890, active: true, image: null },
  { id: 10, name: 'Nước sâm bí đao', category: 'Nước uống', price: 15000, sold: 340, active: true, image: null },
]

export const reservations = [
  { id: 1, name: 'Nguyễn Văn An', phone: '0901234567', date: '2026-07-27', time: '19:00', guests: 4, note: 'Bàn gần cửa sổ', status: 'pending' },
  { id: 2, name: 'Trần Thị Bích', phone: '0912345678', date: '2026-07-27', time: '18:30', guests: 2, note: '', status: 'confirmed' },
  { id: 3, name: 'Lê Hoàng Long', phone: '0987654321', date: '2026-07-28', time: '12:00', guests: 6, note: 'Sinh nhật, cần bánh kem nhỏ', status: 'confirmed' },
  { id: 4, name: 'Phạm Thu Hà', phone: '0977123456', date: '2026-07-28', time: '20:00', guests: 3, note: '', status: 'cancelled' },
  { id: 5, name: 'Đỗ Minh Khoa', phone: '0933221144', date: '2026-07-29', time: '19:30', guests: 8, note: 'Đoàn công ty', status: 'pending' },
]

export const orders = [
  { id: 'DH1024', customer: 'Nguyễn Văn An', items: 3, total: 185000, payment: 'Chuyển khoản', status: 'completed', date: '2026-07-27 11:20' },
  { id: 'DH1025', customer: 'Trần Thị Bích', items: 2, total: 120000, payment: 'Tiền mặt', status: 'processing', date: '2026-07-27 11:45' },
  { id: 'DH1026', customer: 'Vũ Thị Ngọc', items: 5, total: 342000, payment: 'Momo', status: 'processing', date: '2026-07-27 12:05' },
  { id: 'DH1027', customer: 'Lê Hoàng Long', items: 1, total: 55000, payment: 'Chuyển khoản', status: 'cancelled', date: '2026-07-27 12:30' },
  { id: 'DH1028', customer: 'Phạm Thu Hà', items: 4, total: 268000, payment: 'Tiền mặt', status: 'completed', date: '2026-07-26 19:10' },
]

// export const customers = [
//   { id: 1, name: 'Nguyễn Văn An', phone: '0901234567', email: 'an.nguyen@gmail.com', orders: 12, joined: '2025-03-14' },
//   { id: 2, name: 'Trần Thị Bích', phone: '0912345678', email: 'bich.tran@gmail.com', orders: 5, joined: '2025-08-02' },
//   { id: 3, name: 'Vũ Thị Ngọc', phone: '0966554433', email: 'ngoc.vu@gmail.com', orders: 8, joined: '2025-11-20' },
//   { id: 4, name: 'Lê Hoàng Long', phone: '0987654321', email: 'long.le@gmail.com', orders: 21, joined: '2024-12-01' },
// ]

// export const staff = [
//   { id: 1, name: 'Trần Văn Bảo', role: 'Đầu bếp trưởng', phone: '0909090909', status: 'active' },
//   { id: 2, name: 'Nguyễn Thị Hoa', role: 'Phục vụ', phone: '0918181818', status: 'active' },
//   { id: 3, name: 'Phan Đức Anh', role: 'Thu ngân', phone: '0927272727', status: 'active' },
//   { id: 4, name: 'Đặng Mỹ Linh', role: 'Phục vụ', phone: '0936363636', status: 'inactive' },
// ]

export const promotions = [
  { id: 1, name: 'Giảm 20% cuối tuần', type: 'Giảm giá', value: '20%', from: '2026-07-25', to: '2026-07-27', active: true },
  { id: 2, name: 'Combo đôi Phở + Nước', type: 'Combo', value: '99.000đ', from: '2026-07-01', to: '2026-08-01', active: true },
  { id: 3, name: 'Flash Sale 12h trưa', type: 'Flash Sale', value: '30%', from: '2026-07-27', to: '2026-07-27', active: true },
  { id: 4, name: 'Khai trương chi nhánh 2', type: 'Giảm giá', value: '15%', from: '2026-06-01', to: '2026-06-15', active: false },
]

export const news = [
  { id: 1, title: 'Ra mắt món Bún bò Huế đặc biệt', category: 'Món mới', date: '2026-07-20', published: true },
  { id: 2, title: 'Công thức nước dùng phở chuẩn vị Bắc', category: 'Công thức', date: '2026-07-15', published: true },
  { id: 3, title: 'Đêm nhạc acoustic cuối tuần tại nhà hàng', category: 'Sự kiện', date: '2026-07-10', published: true },
  { id: 4, title: 'Khai trương chi nhánh Đà Nẵng', category: 'Khai trương', date: '2026-06-01', published: false },
]

export const reviews = [
  { id: 1, customer: 'Nguyễn Văn An', food: 'Phở bò tái nạm', rating: 5, comment: 'Nước dùng đậm đà, thịt bò mềm.', date: '2026-07-26', status: 'approved' },
  { id: 2, customer: 'Trần Thị Bích', food: 'Bún chả Hà Nội', rating: 4, comment: 'Ngon nhưng hơi mặn.', date: '2026-07-25', status: 'approved' },
  { id: 3, customer: 'Vũ Thị Ngọc', food: 'Cơm tấm sườn nướng', rating: 3, comment: 'Bình thường, giao hơi lâu.', date: '2026-07-24', status: 'pending' },
  { id: 4, customer: 'Lê Hoàng Long', food: 'Chả giò hải sản', rating: 5, comment: 'Giòn rụm, rất đáng thử!', date: '2026-07-23', status: 'pending' },
]

export const revenueByDay = [
  { day: 'T2', revenue: 4200000 },
  { day: 'T3', revenue: 3800000 },
  { day: 'T4', revenue: 5100000 },
  { day: 'T5', revenue: 4600000 },
  { day: 'T6', revenue: 6300000 },
  { day: 'T7', revenue: 8100000 },
  { day: 'CN', revenue: 7400000 },
]

export const topFoods = [
  { name: 'Trà đá', sold: 890 },
  { name: 'Cơm tấm sườn bì chả', sold: 412 },
  { name: 'Phở bò tái nạm', sold: 482 },
  { name: 'Nước sâm bí đao', sold: 340 },
  { name: 'Phở gà', sold: 310 },
]
