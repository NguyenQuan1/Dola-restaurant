export const featuredDishes = [
  {
    id: 'pho-bo-tai-nam',
    name: 'Phở Bò Tái Nạm',
    category: 'Phở',
    price: 65000,
    image:
      'https://images.unsplash.com/photo-1631709497146-a239ef373cf1?q=80&w=900&auto=format&fit=crop',
    desc: 'Nước dùng hầm xương 12 tiếng, bánh phở mềm, thịt bò tái nạm thái mỏng.',
    available: true,
  },
  {
    id: 'bun-cha-ha-noi',
    name: 'Bún Chả Hà Nội',
    category: 'Bún',
    price: 55000,
    image:
      'https://images.unsplash.com/photo-1583316175701-0bc5f25a0a44?q=80&w=900&auto=format&fit=crop',
    desc: 'Chả nướng than hoa thơm lừng, ăn kèm bún tươi và nước chấm chua ngọt.',
    available: true,
  },
  {
    id: 'banh-mi-thit-nuong',
    name: 'Bánh Mì Thịt Nướng',
    category: 'Bánh mì',
    price: 35000,
    image:
      'https://images.unsplash.com/photo-1600454309261-3dc9b7597637?q=80&w=900&auto=format&fit=crop',
    desc: 'Bánh mì giòn rụm, thịt nướng ướp sả ớt, rau thơm và pate tự làm.',
    available: true,
  },
  {
    id: 'com-tam-suon-bi-cha',
    name: 'Cơm Tấm Sườn Bì Chả',
    category: 'Cơm',
    price: 60000,
    image:
      'https://images.unsplash.com/photo-1641440615059-42c8ed3af8c8?q=80&w=900&auto=format&fit=crop',
    desc: 'Sườn nướng mật ong, bì thính, chả trứng hấp, ăn cùng cơm tấm dẻo thơm.',
    available: false,
  },
]

export const testimonials = [
  {
    name: 'Nguyễn Thu Hà',
    role: 'Khách hàng thân thiết',
    rating: 5,
    quote:
      'Phở ở đây đúng vị Hà Nội, nước dùng thanh mà đậm đà. Không gian ấm cúng, nhân viên rất chu đáo.',
  },
  {
    name: 'Trần Minh Khôi',
    role: 'Food blogger',
    rating: 5,
    quote:
      'Bún chả nướng thơm mùi than hoa, ăn kèm nước chấm chuẩn công thức gia truyền. Sẽ quay lại nhiều lần nữa.',
  },
  {
    name: 'Lê Bảo Ngọc',
    role: 'Khách đặt tiệc gia đình',
    rating: 4,
    quote:
      'Đặt bàn cho gia đình 10 người vào cuối tuần, món ăn phong phú và phục vụ rất nhanh nhẹn, thân thiện.',
  },
]

export const promotions = [
  {
    title: 'Combo Gia Đình',
    desc: '4 món chính + 2 tráng miệng, giảm ngay 20% cho nhóm từ 4 người.',
    tag: 'Giảm 20%',
  },
  {
    title: 'Ưu Đãi Cuối Tuần',
    desc: 'Tặng 1 chè hạt sen cho mỗi hóa đơn từ 300.000đ vào Thứ 7 & Chủ nhật.',
    tag: 'Thứ 7 - CN',
  },
  {
    title: 'Thành Viên Dola',
    desc: 'Tích điểm mỗi lần ghé quán, đổi quà và nhận ưu đãi sinh nhật đặc biệt.',
    tag: 'Thành viên',
  },
]

export const formatVND = (value) =>
  value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
