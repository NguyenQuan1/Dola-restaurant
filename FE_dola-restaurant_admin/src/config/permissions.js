// Bảng phân quyền theo role cho từng module quản trị.
// 'full'   -> toàn quyền (thêm/sửa/xoá)
// 'view'   -> chỉ xem
// 'status' -> chỉ được đổi trạng thái hoạt động (không thêm/sửa/xoá)
// 'none'   -> không được truy cập

export const PERMISSIONS = {
  dashboard: { admin: 'full', staff: 'full' },
  categories: { admin: 'full', staff: 'view' },
  foods: { admin: 'full', staff: 'status' },
  reservations: { admin: 'full', staff: 'full' },
  orders: { admin: 'full', staff: 'full' },
  customers: { admin: 'full', staff: 'view' },
  staff: { admin: 'full', staff: 'none' },
  promotions: { admin: 'full', staff: 'none' },
  news: { admin: 'full', staff: 'none' },
  reviews: { admin: 'full', staff: 'full' },
  reports: { admin: 'full', staff: 'none' },
  settings: { admin: 'full', staff: 'none' },
}

export function can(role, moduleKey) {
  return PERMISSIONS[moduleKey]?.[role] || 'none'
}
