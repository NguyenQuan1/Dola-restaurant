export const newsList = [
  {
    slug: 'ra-mat-mon-moi-bun-bo-hue',
    title: 'Dola ra mắt món mới: Bún Bò Huế đậm vị cố đô',
    category: 'Món mới',
    date: '2026-07-10',
    author: 'Đội ngũ Dola',
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=1200&auto=format&fit=crop',
    excerpt:
      'Sau nhiều tháng nghiên cứu công thức, Dola Restaurant chính thức giới thiệu món Bún Bò Huế với hương vị cay nồng đặc trưng.',
    content: [
      'Sau nhiều tháng nghiên cứu và thử nghiệm công thức cùng các đầu bếp đến từ Huế, Dola Restaurant chính thức đưa món Bún Bò Huế vào thực đơn chính thức từ tuần này.',
      'Điểm đặc biệt của món ăn nằm ở nước dùng được ninh từ xương bò và giò heo trong hơn 8 tiếng, kết hợp cùng sả, ớt và mắm ruốc theo đúng công thức gia truyền xứ cố đô.',
      'Khách hàng ghé quán trong tuần khai trương món mới sẽ được giảm 15% khi gọi món Bún Bò Huế, áp dụng đến hết cuối tháng.',
    ],
  },
  {
    slug: 'bi-quyet-nau-nuoc-dung-pho-trong-12-gio',
    title: 'Bí quyết nấu nước dùng phở trong suốt 12 giờ của Dola',
    category: 'Công thức',
    date: '2026-06-22',
    author: 'Bếp trưởng Dola',
    image: 'https://images.unsplash.com/photo-1631709497146-a239ef373cf1?q=80&w=1200&auto=format&fit=crop',
    excerpt:
      'Điều gì làm nên nồi nước dùng phở trong veo, ngọt thanh đặc trưng của Dola? Cùng bếp trưởng bật mí quy trình chế biến.',
    content: [
      'Một nồi nước dùng phở ngon phải bắt đầu từ khâu chọn xương: xương ống bò tươi được rửa sạch, chần sơ qua nước sôi để loại bỏ tạp chất trước khi hầm.',
      'Xương được hầm liên tục trong 12 giờ ở lửa nhỏ, kết hợp cùng gừng nướng, hành nướng và các loại gia vị như quế, hồi, thảo quả để tạo hương thơm đặc trưng.',
      'Bí quyết cuối cùng nằm ở việc vớt bọt liên tục trong quá trình hầm để nước dùng luôn trong veo, không bị đục hay có mùi hôi của xương.',
    ],
  },
  {
    slug: 'su-kien-am-thuc-cuoi-tuan-thang-8',
    title: 'Sự kiện ẩm thực ba miền cuối tuần tháng 8 tại Dola',
    category: 'Sự kiện',
    date: '2026-07-20',
    author: 'Đội ngũ Dola',
    image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?q=80&w=1200&auto=format&fit=crop',
    excerpt:
      'Dola tổ chức chuỗi sự kiện trải nghiệm ẩm thực ba miền Bắc - Trung - Nam vào mỗi cuối tuần trong tháng 8, kèm nhiều hoạt động thú vị.',
    content: [
      'Trong suốt tháng 8, vào mỗi tối Thứ 7 và Chủ nhật, Dola Restaurant sẽ tổ chức các buổi trải nghiệm ẩm thực theo chủ đề ba miền Bắc - Trung - Nam.',
      'Thực khách sẽ được thưởng thức các món ăn đặc trưng vùng miền, kèm theo phần trình diễn pha chế và giao lưu cùng đầu bếp.',
      'Số lượng bàn có hạn, quý khách vui lòng đặt bàn trước để đảm bảo có chỗ tham dự sự kiện.',
    ],
  },
  {
    slug: 'dola-restaurant-chinh-thuc-khai-truong',
    title: 'Dola Restaurant chính thức khai trương tại Đà Nẵng',
    category: 'Khai trương',
    date: '2026-03-01',
    author: 'Đội ngũ Dola',
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=1200&auto=format&fit=crop',
    excerpt:
      'Dola Restaurant chính thức mở cửa đón khách tại trung tâm Đà Nẵng, mang theo sứ mệnh gìn giữ hương vị ẩm thực Việt truyền thống.',
    content: [
      'Sau thời gian dài chuẩn bị, Dola Restaurant đã chính thức khai trương và đón những vị khách đầu tiên tại địa chỉ 123 Đường Trần Phú, Hải Châu, Đà Nẵng.',
      'Không gian nhà hàng được thiết kế theo phong cách Đông Dương hiện đại, kết hợp giữa nét truyền thống và tiện nghi hiện đại nhằm mang đến trải nghiệm ẩm thực trọn vẹn.',
      'Nhân dịp khai trương, Dola dành tặng ưu đãi giảm 30% cho hóa đơn đầu tiên của tất cả thực khách trong tuần đầu mở cửa.',
    ],
  },
]

export const getNewsBySlug = (slug) => newsList.find((n) => n.slug === slug)

export const getRelatedNews = (news, limit = 3) =>
  newsList.filter((n) => n.slug !== news.slug).slice(0, limit)
