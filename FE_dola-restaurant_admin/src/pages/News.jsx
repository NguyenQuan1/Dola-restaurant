import { useEffect, useState } from 'react'
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight, X, Star } from 'lucide-react'
import Toolbar from '../components/Toolbar.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { TableCard, Thead, Tr, Td } from '../components/Table.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import newsCategoryService from '../api/news-categories.js'
import newsService from '../api/news.js'

const PAGE_SIZE = 3
const NEWS_PAGE_SIZE = 10
const emptyCategoryForm = { name: '' }
const emptyNewsForm = {
  categoryId: '',
  title: '',
  excerpt: '',
  content: '',
  isPublished: false,
  images: [], // mảng URL ảnh (đã có sẵn hoặc vừa thêm)
}

export default function News() {
  // --- 1. STATES PHẦN CHUYÊN MỤC TIN TỨC ---
  const [newsCategories, setNewsCategories] = useState([])
  const [catLoading, setCatLoading] = useState(true)
  const [catSearch, setCatSearch] = useState('')
  const [catError, setCatError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [catModalOpen, setCatModalOpen] = useState(false)
  const [catEditing, setCatEditing] = useState(null)
  const [catForm, setCatForm] = useState(emptyCategoryForm)
  const [catFormError, setCatFormError] = useState('')
  const [catSaving, setCatSaving] = useState(false)

  const [catDeleting, setCatDeleting] = useState(null)
  const [catDeleteLoading, setCatDeleteLoading] = useState(false)
  const [catDeleteError, setCatDeleteError] = useState('')

  // --- 2. STATES PHẦN TIN TỨC ---
  const [newsList, setNewsList] = useState([])
  const [newsTotal, setNewsTotal] = useState(0)
  const [newsLoading, setNewsLoading] = useState(true)
  const [newsSearch, setNewsSearch] = useState('')
  const [newsError, setNewsError] = useState('')
  const [newsPage, setNewsPage] = useState(1)

  const [newsModalOpen, setNewsModalOpen] = useState(false)
  const [newsEditing, setNewsEditing] = useState(null)
  const [newsForm, setNewsForm] = useState(emptyNewsForm)
  const [newsFormError, setNewsFormError] = useState('')
  const [newsSaving, setNewsSaving] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState('')

  const [newsDeleting, setNewsDeleting] = useState(null)
  const [newsDeleteLoading, setNewsDeleteLoading] = useState(false)
  const [newsDeleteError, setNewsDeleteError] = useState('')

  // --- 3. FETCH: CHUYÊN MỤC ---
  const fetchCategories = async (searchTerm = catSearch) => {
    setCatLoading(true)
    setCatError('')
    try {
      const data = await newsCategoryService.getAll({ search: searchTerm || undefined })
      setNewsCategories(data?.items ?? [])
      setCurrentPage(1)
    } catch (err) {
      setCatError(err?.response?.data?.message || 'Không tải được danh sách chuyên mục')
    } finally {
      setCatLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories('')
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchCategories(catSearch), 400)
    return () => clearTimeout(timer)
  }, [catSearch])

  const totalPages = Math.max(1, Math.ceil(newsCategories.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const paginatedCategories = newsCategories.slice(startIndex, startIndex + PAGE_SIZE)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  // --- 4. FETCH: TIN TỨC ---
  const fetchNews = async (page = newsPage, searchTerm = newsSearch) => {
    setNewsLoading(true)
    setNewsError('')
    try {
      const data = await newsService.getAll({
        search: searchTerm || undefined,
        page,
        limit: NEWS_PAGE_SIZE,
      })
      setNewsList(data?.items ?? [])
      setNewsTotal(data?.total ?? 0)
    } catch (err) {
      setNewsError(err?.response?.data?.message || 'Không tải được danh sách bài viết')
    } finally {
      setNewsLoading(false)
    }
  }

  useEffect(() => {
    fetchNews(1, '')
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setNewsPage(1)
      fetchNews(1, newsSearch)
    }, 400)
    return () => clearTimeout(timer)
  }, [newsSearch])

  const newsTotalPages = Math.max(1, Math.ceil(newsTotal / NEWS_PAGE_SIZE))

  const goToNewsPage = (page) => {
    const safe = Math.min(Math.max(1, page), newsTotalPages)
    setNewsPage(safe)
    fetchNews(safe, newsSearch)
  }

  // --- 5. LOGIC FORM CHUYÊN MỤC ---
  const openCreateCat = () => {
    setCatEditing(null)
    setCatForm(emptyCategoryForm)
    setCatFormError('')
    setCatModalOpen(true)
  }

  const openEditCat = (c) => {
    setCatEditing(c)
    setCatForm({ name: c.name || '' })
    setCatFormError('')
    setCatModalOpen(true)
  }

  const handleSubmitCat = async (e) => {
    e.preventDefault()
    const trimmedName = catForm.name.trim()

    if (!trimmedName) {
      setCatFormError('Vui lòng nhập tên chuyên mục')
      return
    }

    setCatSaving(true)
    setCatFormError('')
    try {
      const payload = { name: trimmedName }
      if (catEditing) {
        await newsCategoryService.update(catEditing.id, payload)
      } else {
        await newsCategoryService.create(payload)
      }
      setCatModalOpen(false)
      fetchCategories()
    } catch (err) {
      const message = err?.response?.data?.message
      setCatFormError(Array.isArray(message) ? message[0] : message || 'Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setCatSaving(false)
    }
  }

  const handleDeleteCat = async () => {
    if (!catDeleting) return
    setCatDeleteLoading(true)
    setCatDeleteError('')
    try {
      await newsCategoryService.remove(catDeleting.id)
      setCatDeleting(null)
      fetchCategories()
    } catch (err) {
      setCatDeleteError(err?.response?.data?.message || 'Không xóa được chuyên mục này.')
    } finally {
      setCatDeleteLoading(false)
    }
  }

  // --- 6. LOGIC FORM TIN TỨC (kèm ảnh) ---
  const openCreateNews = () => {
    setNewsEditing(null)
    setNewsForm(emptyNewsForm)
    setNewImageUrl('')
    setNewsFormError('')
    setNewsModalOpen(true)
  }

  const openEditNews = (n) => {
    setNewsEditing(n)
    setNewsForm({
      categoryId: n.categoryId ?? n.category?.id ?? '',
      title: n.title || '',
      excerpt: n.excerpt || '',
      content: n.content || '',
      isPublished: !!n.isPublished,
      images: (n.images || []).map((img) => img.imageUrl),
    })
    setNewImageUrl('')
    setNewsFormError('')
    setNewsModalOpen(true)
  }

  // Thêm URL ảnh vào danh sách đang soạn (ảnh coi như đã upload lên
  // Uploadcare/CDN từ trước, ở đây chỉ dán URL vào — giống cách làm ở foods).
  const handleAddImageUrl = () => {
    const url = newImageUrl.trim()
    if (!url) return
    setNewsForm((f) => ({ ...f, images: [...f.images, url] }))
    setNewImageUrl('')
  }

  const handleRemoveImageUrl = (index) => {
    setNewsForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }))
  }

  const handleSubmitNews = async (e) => {
    e.preventDefault()
    const trimmedTitle = newsForm.title.trim()

    if (!newsForm.categoryId) {
      setNewsFormError('Vui lòng chọn chuyên mục')
      return
    }
    if (!trimmedTitle) {
      setNewsFormError('Vui lòng nhập tiêu đề')
      return
    }
    if (!newsForm.content.trim()) {
      setNewsFormError('Vui lòng nhập nội dung bài viết')
      return
    }

    setNewsSaving(true)
    setNewsFormError('')
    try {
      if (newsEditing) {
        // Với sửa bài: cập nhật thông tin trước, ảnh xử lý riêng bên dưới.
        await newsService.update(newsEditing.id, {
          categoryId: Number(newsForm.categoryId),
          title: trimmedTitle,
          excerpt: newsForm.excerpt.trim() || undefined,
          content: newsForm.content,
          isPublished: newsForm.isPublished,
        })

        const existingUrls = (newsEditing.images || []).map((img) => img.imageUrl)
        const newUrls = newsForm.images.filter((url) => !existingUrls.includes(url))
        if (newUrls.length > 0) {
          await newsService.addImages(newsEditing.id, newUrls)
        }
      } else {
        await newsService.create({
          categoryId: Number(newsForm.categoryId),
          title: trimmedTitle,
          excerpt: newsForm.excerpt.trim() || undefined,
          content: newsForm.content,
          isPublished: newsForm.isPublished,
          images: newsForm.images.length > 0 ? newsForm.images : undefined,
        })
      }
      setNewsModalOpen(false)
      fetchNews(newsEditing ? newsPage : 1, newsSearch)
    } catch (err) {
      const message = err?.response?.data?.message
      setNewsFormError(Array.isArray(message) ? message[0] : message || 'Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setNewsSaving(false)
    }
  }

  const handleTogglePublish = async (n) => {
    try {
      await newsService.togglePublish(n.id)
      fetchNews(newsPage, newsSearch)
    } catch (err) {
      setNewsError(err?.response?.data?.message || 'Không đổi được trạng thái đăng bài')
    }
  }

  // --- 7. LOGIC XÓA TIN TỨC ---
  const handleDeleteNews = async () => {
    if (!newsDeleting) return
    setNewsDeleteLoading(true)
    setNewsDeleteError('')
    try {
      await newsService.remove(newsDeleting.id)
      setNewsDeleting(null)
      fetchNews(newsPage, newsSearch)
    } catch (err) {
      setNewsDeleteError(err?.response?.data?.message || 'Không xóa được bài viết này.')
    } finally {
      setNewsDeleteLoading(false)
    }
  }

  return (
    <div>
      {/* ================= PHẦN 1: CHUYÊN MỤC TIN TỨC ================= */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-ink">Chuyên mục tin tức</h2>
          <div className="flex items-center gap-2">
            <input
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
              placeholder="Tìm chuyên mục..."
              className="px-3 py-1.5 rounded-lg border border-black/10 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            <button
              onClick={openCreateCat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink text-white text-sm hover:opacity-90"
            >
              <Plus size={14} />
              Thêm chuyên mục
            </button>
          </div>
        </div>

        {catError && (
          <div className="mb-4 rounded-lg border border-clay/30 bg-clay-light px-4 py-2.5 text-sm text-clay">
            {catError}
          </div>
        )}

        <TableCard>
          <Thead columns={['Tên', 'Slug', 'Thao tác']} />
          <tbody className="min-h-[168px]">
            {catLoading && (
              <tr>
                <td colSpan={3} className="px-5 py-6 text-center text-sm text-muted">
                  Đang tải...
                </td>
              </tr>
            )}
            {!catLoading && newsCategories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-6 text-center text-sm text-muted">
                  Không có chuyên mục nào.
                </td>
              </tr>
            )}
            {!catLoading &&
              paginatedCategories.map((c) => (
                <Tr key={c.id}>
                  <Td className="font-medium text-ink">{c.name}</Td>
                  <Td className="text-xs text-muted font-mono">{c.slug}</Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditCat(c)}
                        className="w-8 h-8 grid place-items-center rounded-lg hover:bg-black/[0.04] text-ink-soft"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setCatDeleting(c)}
                        className="w-8 h-8 grid place-items-center rounded-lg hover:bg-clay-light text-clay"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}

            {!catLoading && paginatedCategories.length > 0 && paginatedCategories.length < PAGE_SIZE &&
              Array.from({ length: PAGE_SIZE - paginatedCategories.length }).map((_, i) => (
                <Tr key={`ph-${i}`}>
                  <td colSpan={3} className="h-12 border-0">&nbsp;</td>
                </Tr>
              ))
            }
          </tbody>
        </TableCard>

        {!catLoading && newsCategories.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-3 px-1">
            <span className="text-xs text-muted">
              {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, newsCategories.length)} / {newsCategories.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="w-8 h-8 grid place-items-center rounded-full border border-black/10 disabled:opacity-40 hover:bg-black/[0.04] text-ink-soft"
                title="Trang trước"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    page === safePage
                      ? 'bg-ink text-white'
                      : 'border border-black/10 hover:bg-black/[0.04]'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="w-8 h-8 grid place-items-center rounded-full border border-black/10 disabled:opacity-40 hover:bg-black/[0.04] text-ink-soft"
                title="Trang sau"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= PHẦN 2: DANH SÁCH TIN TỨC ================= */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-ink">Tin tức</h2>
        </div>
        <Toolbar
          searchPlaceholder="Tìm bài viết..."
          addLabel="Viết bài mới"
          searchValue={newsSearch}
          onSearchChange={setNewsSearch}
          onAdd={openCreateNews}
        />

        {newsError && (
          <div className="mb-4 rounded-lg border border-clay/30 bg-clay-light px-4 py-2.5 text-sm text-clay">
            {newsError}
          </div>
        )}

        <TableCard>
          <Thead columns={['Ảnh', 'Tiêu đề', 'Chuyên mục', 'Ngày đăng', 'Trạng thái', 'Thao tác']} />
          <tbody>
            {newsLoading && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-sm text-muted">
                  Đang tải...
                </td>
              </tr>
            )}
            {!newsLoading && newsList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-sm text-muted">
                  Chưa có bài viết nào.
                </td>
              </tr>
            )}
            {!newsLoading &&
              newsList.map((n) => (
                <Tr key={n.id}>
                  <Td>
                    {n.thumbnailUrl ? (
                      <img
                        src={n.thumbnailUrl}
                        alt={n.title}
                        className="w-10 h-10 rounded-lg object-cover border border-black/10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-black/[0.04]" />
                    )}
                  </Td>
                  <Td className="font-medium text-ink max-w-sm">{n.title}</Td>
                  <Td>
                    <span className="px-2 py-1 rounded-md bg-black/[0.04] text-xs text-ink-soft">
                      {n.category?.name || '—'}
                    </span>
                  </Td>
                  <Td className="text-xs text-muted">
                    {n.publishedAt
                      ? new Date(n.publishedAt).toLocaleDateString('vi-VN')
                      : new Date(n.createdAt).toLocaleDateString('vi-VN')}
                  </Td>
                  <Td>
                    <button onClick={() => handleTogglePublish(n)}>
                      <StatusBadge status={n.isPublished ? 'published' : 'draft'} />
                    </button>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditNews(n)}
                        className="w-8 h-8 grid place-items-center rounded-lg hover:bg-black/[0.04] text-ink-soft"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setNewsDeleting(n)}
                        className="w-8 h-8 grid place-items-center rounded-lg hover:bg-clay-light text-clay"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
          </tbody>
        </TableCard>

        {!newsLoading && newsTotal > NEWS_PAGE_SIZE && (
          <div className="flex items-center justify-between mt-3 px-1">
            <span className="text-xs text-muted">
              Trang {newsPage} / {newsTotalPages} — {newsTotal} bài viết
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => goToNewsPage(newsPage - 1)}
                disabled={newsPage <= 1}
                className="w-8 h-8 grid place-items-center rounded-full border border-black/10 disabled:opacity-40 hover:bg-black/[0.04] text-ink-soft"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => goToNewsPage(newsPage + 1)}
                disabled={newsPage >= newsTotalPages}
                className="w-8 h-8 grid place-items-center rounded-full border border-black/10 disabled:opacity-40 hover:bg-black/[0.04] text-ink-soft"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL CHUYÊN MỤC ================= */}
      <Modal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={catEditing ? 'Sửa chuyên mục' : 'Thêm chuyên mục'}
      >
        <form onSubmit={handleSubmitCat} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Tên chuyên mục</label>
            <input
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              placeholder="VD: Khuyến mãi, Tin nội bộ..."
            />
          </div>
          {catFormError && <p className="text-xs text-clay">{catFormError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCatModalOpen(false)}
              className="px-4 py-2 text-sm rounded-lg border border-border text-ink-soft hover:bg-black/[0.03]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={catSaving}
              className="px-4 py-2 text-sm rounded-lg bg-ink text-paper hover:bg-ink-soft font-medium disabled:opacity-60"
            >
              {catSaving ? 'Đang lưu...' : catEditing ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!catDeleting}
        onClose={() => {
          setCatDeleting(null)
          setCatDeleteError('')
        }}
        onConfirm={handleDeleteCat}
        loading={catDeleteLoading}
        title="Xóa chuyên mục"
        message={
          catDeleteError ||
          `Bạn có chắc muốn xóa chuyên mục "${catDeleting?.name}"? Hành động này không thể hoàn tác.`
        }
      />

      {/* ================= MODAL TIN TỨC (kèm ảnh) ================= */}
      <Modal
        open={newsModalOpen}
        onClose={() => setNewsModalOpen(false)}
        title={newsEditing ? 'Sửa bài viết' : 'Viết bài mới'}
      >
        <form onSubmit={handleSubmitNews} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Chuyên mục</label>
            <select
              value={newsForm.categoryId}
              onChange={(e) => setNewsForm({ ...newsForm, categoryId: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
            >
              <option value="">-- Chọn chuyên mục --</option>
              {newsCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Tiêu đề</label>
            <input
              value={newsForm.title}
              onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              placeholder="Tiêu đề bài viết"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Mô tả ngắn</label>
            <input
              value={newsForm.excerpt}
              onChange={(e) => setNewsForm({ ...newsForm, excerpt: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              placeholder="Mô tả ngắn hiển thị ở trang danh sách..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Nội dung</label>
            <textarea
              value={newsForm.content}
              onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
              rows={6}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              placeholder="Nội dung bài viết..."
            />
          </div>

          {/* Quản lý ảnh — dán URL ảnh đã upload lên Uploadcare/CDN, giống foods */}
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Ảnh bài viết</label>
            <div className="flex gap-2 mb-2">
              <input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddImageUrl()
                  }
                }}
                placeholder="Dán URL ảnh rồi nhấn Thêm..."
                className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-3 py-2 text-sm rounded-lg border border-border text-ink-soft hover:bg-black/[0.03]"
              >
                Thêm
              </button>
            </div>

            {newsForm.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newsForm.images.map((url, index) => (
                  <div key={`${url}-${index}`} className="relative w-16 h-16 group">
                    <img
                      src={url}
                      alt={`Ảnh ${index + 1}`}
                      className="w-16 h-16 rounded-lg object-cover border border-black/10"
                    />
                    {index === 0 && (
                      <span className="absolute -top-1.5 -left-1.5 w-5 h-5 grid place-items-center rounded-full bg-ink text-white">
                        <Star size={10} fill="currentColor" />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImageUrl(index)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 grid place-items-center rounded-full bg-clay text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-muted">Ảnh đầu tiên sẽ được dùng làm ảnh đại diện.</p>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={newsForm.isPublished}
              onChange={(e) => setNewsForm({ ...newsForm, isPublished: e.target.checked })}
              className="rounded border-black/20"
            />
            Đăng bài ngay
          </label>

          {newsFormError && <p className="text-xs text-clay">{newsFormError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setNewsModalOpen(false)}
              className="px-4 py-2 text-sm rounded-lg border border-border text-ink-soft hover:bg-black/[0.03]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={newsSaving}
              className="px-4 py-2 text-sm rounded-lg bg-ink text-paper hover:bg-ink-soft font-medium disabled:opacity-60"
            >
              {newsSaving ? 'Đang lưu...' : newsEditing ? 'Cập nhật' : 'Đăng bài'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!newsDeleting}
        onClose={() => {
          setNewsDeleting(null)
          setNewsDeleteError('')
        }}
        onConfirm={handleDeleteNews}
        loading={newsDeleteLoading}
        title="Xóa bài viết"
        message={
          newsDeleteError ||
          `Bạn có chắc muốn xóa bài viết "${newsDeleting?.title}"? Hành động này không thể hoàn tác.`
        }
      />
    </div>
  )
}