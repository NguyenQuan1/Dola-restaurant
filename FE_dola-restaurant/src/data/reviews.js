export const reviewsByFood = {
  'pho-bo-tai-nam': [
    { name: 'Nguyễn Thu Hà', rating: 5, date: '2026-06-12', comment: 'Nước dùng thanh mà đậm đà, thịt bò tái mềm ngọt. Đúng chuẩn phở Hà Nội.' },
    { name: 'Phạm Anh Tuấn', rating: 5, date: '2026-05-28', comment: 'Ăn ở đây quen rồi, tuần nào cũng ghé ăn tô phở tái nạm này.' },
    { name: 'Đỗ Quỳnh Chi', rating: 4, date: '2026-05-02', comment: 'Ngon nhưng hơi mặn với khẩu vị của mình, tổng thể vẫn ổn.' },
  ],
  'bun-cha-ha-noi': [
    { name: 'Trần Minh Khôi', rating: 5, date: '2026-06-20', comment: 'Chả nướng thơm mùi than hoa, nước chấm chuẩn công thức gia truyền.' },
    { name: 'Vũ Hải Yến', rating: 4, date: '2026-05-15', comment: 'Phần ăn khá đầy đặn, rau sống tươi ngon.' },
  ],
  'banh-mi-thit-nuong': [
    { name: 'Lê Bảo Ngọc', rating: 5, date: '2026-06-18', comment: 'Bánh mì giòn, pate béo mà không ngấy, thịt nướng thơm sả.' },
    { name: 'Hoàng Gia Bảo', rating: 4, date: '2026-04-30', comment: 'Ngon, giá hợp lý, sẽ ủng hộ tiệm dài dài.' },
  ],
  'com-tam-suon-bi-cha': [
    { name: 'Ngô Thanh Trúc', rating: 5, date: '2026-06-05', comment: 'Sườn nướng mật ong ngon xuất sắc, bì thính giòn tan.' },
  ],
}

export const getReviews = (foodId) => reviewsByFood[foodId] || []

export const getAverageRating = (foodId, fallback = 0) => {
  const list = getReviews(foodId)
  if (!list.length) return fallback
  return Number((list.reduce((sum, r) => sum + r.rating, 0) / list.length).toFixed(1))
}
