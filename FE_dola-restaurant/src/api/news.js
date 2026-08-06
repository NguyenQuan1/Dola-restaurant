import { apiClient } from './client'

// Tương tự toAbsoluteUrl ở foods.js — URL Uploadcare là tuyệt đối, dùng thẳng.
export const toAbsoluteUrl = (url) => {
  if (!url) return null
  return /^https?:\/\//i.test(url) ? url : `${apiClient.defaults.baseURL}${url}`
}

// Chuẩn hóa 1 news object từ API sang shape mà News.jsx / NewsDetail.jsx dùng.
function normalizeNews(apiNews) {
  const thumbnail =
    apiNews.thumbnailUrl
      ? toAbsoluteUrl(apiNews.thumbnailUrl)
      : apiNews.images && apiNews.images.length > 0
        ? toAbsoluteUrl(apiNews.images[0].imageUrl)
        : null

  return {
    id: apiNews.id,
    slug: apiNews.slug,
    title: apiNews.title,
    excerpt: apiNews.excerpt || '',
    content: apiNews.content || '',
    image: thumbnail,
    category: apiNews.category?.name ?? '',
    categorySlug: apiNews.category?.slug ?? '',
    publishedAt: apiNews.publishedAt || apiNews.createdAt,
    isPublished: apiNews.isPublished,
  }
}

const newsService = {
  async getAll(params = {}) {
    const query = {}
    if (params.search) query.search = params.search
    if (params.categoryId) query.categoryId = params.categoryId
    if (params.limit) query.limit = String(params.limit)
    if (params.page) query.page = String(params.page)

    const { data } = await apiClient.get('/public/news', { params: query })
    const list = Array.isArray(data) ? data : data?.items ?? []
    return {
      items: list.map(normalizeNews),
      total: data?.total ?? list.length,
      page: data?.page ?? 1,
      limit: data?.limit ?? list.length,
    }
  },

  async getById(id) {
    try {
      const { data } = await apiClient.get(`/public/news/${id}`)
      return normalizeNews(data)
    } catch (err) {
      if (err.response?.status === 404) return null
      throw err
    }
  },
}

export default newsService
