import { apiClient } from './client'

// Ảnh Uploadcare là URL tuyệt đối, dùng thẳng. Ảnh kiểu cũ (/uploads/foods/..)
// là đường dẫn tương đối, phải ghép với baseURL mới xem được.
export const toAbsoluteUrl = (url) => {
  if (!url) return null
  return /^https?:\/\//i.test(url) ? url : `${apiClient.defaults.baseURL}${url}`
}

export const formatVND = (value) =>
  Number(value).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })

// Chuyển 1 food object từ API (foods.service.ts) sang đúng shape mà
// FoodCard.jsx / FoodDetail.jsx / Home.jsx đang dùng — nhờ vậy không cần
// sửa các component đó chút nào.
function normalizeFood(apiFood) {
  const images =
    apiFood.images && apiFood.images.length > 0
      ? apiFood.images.map((img) => toAbsoluteUrl(img.imageUrl))
      : apiFood.thumbnailUrl
        ? [toAbsoluteUrl(apiFood.thumbnailUrl)]
        : []

  return {
    id: apiFood.id,
    name: apiFood.name,
    category: apiFood.category?.slug ?? '',
    categoryName: apiFood.category?.name ?? '',
    price: Number(apiFood.price),
    image: images[0] ?? toAbsoluteUrl(apiFood.thumbnailUrl),
    images: images.length > 0 ? images : ['/placeholder-food.jpg'],
    desc: apiFood.description || '',
    ingredients: apiFood.ingredients
      ? apiFood.ingredients.split('\n').map((s) => s.trim()).filter(Boolean)
      : [],
    available: !!apiFood.isActive,
    isFeatured: !!apiFood.isFeatured,
    // Backend chưa có hệ thống rating -> tạm để 0, ẩn sao trên UI cho tới
    // khi có bảng reviews thật kết nối vào food.
    rating: 0,
    reviewCount: 0,
  }
}

// Gom các hàm đọc dữ liệu food (public, không cần đăng nhập) vào 1 object
// — cùng cấu trúc với foodService bên Admin, để 2 project dễ đối chiếu.
const foodService = {
  async getAll(params = {}) {
    const query = {}
    if (params.search) query.search = params.search
    if (params.categoryId) query.categoryId = params.categoryId
    if (params.isFeatured !== undefined) query.isFeatured = String(params.isFeatured)
    if (params.limit) query.limit = String(params.limit)

    const { data } = await apiClient.get('/public/foods', { params: query })
    const list = Array.isArray(data) ? data : data?.items ?? []
    return list.map(normalizeFood)
  },

  async getById(id) {
    try {
      const { data } = await apiClient.get(`/public/foods/${id}`)
      return normalizeFood(data)
    } catch (err) {
      if (err.response?.status === 404) return null
      throw err
    }
  },
}

export default foodService