import { useEffect, useState } from 'react'
import { FileUploaderRegular } from '@uploadcare/react-uploader'
import '@uploadcare/react-uploader/core.css'
import { Pencil, Trash2, ImageOff, X, Star, Eye } from 'lucide-react'
import Toolbar from '../components/Toolbar.jsx'
import Toggle from '../components/Toggle.jsx'
import { TableCard, Thead, Tr, Td } from '../components/Table.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useAuth } from '../context/AuthContext'
import foodService from '../api/foods'
import categoryService from '../api/categories'
import { apiClient } from '../api/client'

const UPLOADCARE_PUBLIC_KEY = import.meta.env.VITE_UPLOADCARE_PUBLIC_KEY

const currency = (n) => Number(n).toLocaleString('vi-VN') + 'đ'

// Ảnh mới (Uploadcare) đã là URL tuyệt đối -> dùng thẳng.
// Ảnh cũ (được lưu theo kiểu cũ, dạng /uploads/foods/xxx) -> ghép baseURL để tương thích ngược.
const toImageSrc = (url) => {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  return `${apiClient.defaults.baseURL}${url}`
}

const emptyForm = {
  categoryId: '',
  name: '',
  price: '',
  description: '',
  ingredients: '',
  isActive: true,
  isFeatured: false,
}

const getCategoryDisplayName = (food, categories) => {
  const resolvedCategoryId = food?.categoryId ?? food?.category?.id ?? ''
  const selectedCategory = categories.find((c) => String(c.id) === String(resolvedCategoryId))
  return selectedCategory?.name || food?.categoryName || food?.category?.name || '—'
}

const buildFoodWithCategory = (food, categories, categoryIdValue) => {
  const resolvedCategoryId = categoryIdValue ?? food?.categoryId ?? food?.category?.id ?? ''
  const selectedCategory = categories.find((c) => String(c.id) === String(resolvedCategoryId))

  return {
    ...food,
    categoryId: resolvedCategoryId === '' ? undefined : Number(resolvedCategoryId),
    category: selectedCategory ? { ...selectedCategory } : food?.category || null,
    categoryName: selectedCategory?.name || food?.categoryName || food?.category?.name || '—',
  }
}

export default function Foods() {
  const { role } = useAuth()
  const canEdit = role === 'admin'

  const [foods, setFoods] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')

  // ----- modal thêm/sửa -----
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // ảnh mới (URL trả về từ Uploadcare) — dùng cho cả tạo mới và sửa
  const [newImageUrls, setNewImageUrls] = useState([]) // chỉ dùng khi TẠO MỚI
  const [existingImages, setExistingImages] = useState([]) // chỉ dùng khi SỬA
  const [imageError, setImageError] = useState('')

  // ----- modal xem chi tiết -----
  const [viewing, setViewing] = useState(null)
  const [activeImageIdx, setActiveImageIdx] = useState(0)

  // ----- xóa món -----
  const [deleting, setDeleting] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    categoryService
      .getAll({ isActive: true, limit: 100 })
      .then((data) => setCategories(data?.items ?? data ?? []))
      .catch(() => { })
  }, [])

  const fetchFoods = () => {
    setLoading(true)
    setError('')
    foodService
      .getAll({ search: search || undefined, categoryId: categoryId || undefined, limit: 50 })
      .then((data) => {
        const items = Array.isArray(data?.items) ? data.items : []
        setFoods(items.map((food) => buildFoodWithCategory(food, categories, food.categoryId ?? food.category?.id)))
      })
      .catch(() => setError('Không tải được danh sách món ăn'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(fetchFoods, 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryId, categories])

  // ---------------------------------------------------------------
  // Mở modal thêm/sửa
  // ---------------------------------------------------------------
  const openCreate = () => {
    if (!canEdit) return
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setImageError('')
    setNewImageUrls([])
    setExistingImages([])
    setModalOpen(true)
  }

  const openEdit = (food) => {
    if (!canEdit) return
    setEditing(food)
    const selectedCatId = food.categoryId ?? food.category?.id ?? ''
    setForm({
      categoryId: String(selectedCatId),
      name: food.name || '',
      price: food.price ?? '',
      description: food.description || '',
      ingredients: food.ingredients || '',
      isActive: food.isActive ?? true,
      isFeatured: food.isFeatured ?? false,
    })
    setFormError('')
    setImageError('')
    setNewImageUrls([])
    setExistingImages(food.images ?? [])
    setModalOpen(true)
  }

  const closeModal = () => setModalOpen(false)

  // ---------------------------------------------------------------
  // Xem chi tiết
  // ---------------------------------------------------------------
  const openView = (food) => {
    setViewing(food)
    setActiveImageIdx(0)
  }
  const closeView = () => setViewing(null)

  // ---------------------------------------------------------------
  // Uploadcare — thêm ảnh mới (TẠO MỚI): chỉ gom URL, gửi kèm lúc submit
  // ---------------------------------------------------------------
  const handleNewUploadSuccess = (event) => {
    const files = event?.allEntries?.filter((f) => f.status === 'success') ?? []
    const urls = files.map((f) => f.cdnUrl).filter(Boolean)
    if (urls.length > 0) {
      setNewImageUrls((prev) => [...prev, ...urls])
    }
  }

  const removeNewImageUrl = (url) => {
    setNewImageUrls((prev) => prev.filter((u) => u !== url))
  }

  // ---------------------------------------------------------------
  // Uploadcare — thêm ảnh (SỬA): upload xong -> gọi API lưu ngay
  // ---------------------------------------------------------------
  const handleExistingUploadSuccess = async (event) => {
    if (!editing) return
    const files = event?.allEntries?.filter((f) => f.status === 'success') ?? []
    const urls = files.map((f) => f.cdnUrl).filter(Boolean)
    if (urls.length === 0) return

    setImageError('')
    try {
      const updated = await foodService.addImages(editing.id, urls)
      setExistingImages(updated.images ?? [])
      setEditing(updated)
    } catch (err) {
      setImageError(err?.response?.data?.message || 'Không thể lưu ảnh này')
    }
  }

  const handleRemoveExistingImage = async (imageId) => {
    if (!editing) return
    try {
      const updated = await foodService.removeImage(editing.id, imageId)
      setExistingImages(updated.images ?? [])
      setEditing(updated)
    } catch (err) {
      setImageError(err?.response?.data?.message || 'Không thể xóa ảnh này')
    }
  }

  const handleSetThumbnail = async (imageId) => {
    if (!editing) return
    try {
      const updated = await foodService.setThumbnail(editing.id, imageId)
      setEditing(updated)
      setExistingImages(updated.images ?? [])
    } catch (err) {
      setImageError(err?.response?.data?.message || 'Không thể đặt ảnh đại diện')
    }
  }

  // ---------------------------------------------------------------
  // Submit form thông tin món
  // ---------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedName = form.name.trim()

    if (!trimmedName) return setFormError('Vui lòng nhập tên món ăn')
    if (!form.categoryId) return setFormError('Vui lòng chọn danh mục')
    if (form.price === '' || Number(form.price) < 0) return setFormError('Vui lòng nhập giá hợp lệ')

    setSaving(true)
    setFormError('')
    try {
      const payload = {
        categoryId: Number(form.categoryId),
        name: trimmedName,
        price: Number(form.price),
        description: form.description?.trim() || undefined,
        ingredients: form.ingredients?.trim() || undefined,
        isActive: !!form.isActive,
        isFeatured: !!form.isFeatured,
      }

      if (editing) {
        const updatedFood = await foodService.update(editing.id, payload)
        const freshFood = await foodService.getById(editing.id)
        const fullUpdatedData = buildFoodWithCategory(
          { ...freshFood, ...updatedFood },
          categories,
          form.categoryId,
        )

        setFoods((prev) => prev.map((item) => (item.id === editing.id ? { ...item, ...fullUpdatedData } : item)))
        setViewing((prev) => (prev?.id === editing.id ? { ...prev, ...fullUpdatedData } : prev))
        setEditing((prev) => (prev?.id === editing.id ? { ...prev, ...fullUpdatedData } : prev))
      } else {
        await foodService.create({ ...payload, images: newImageUrls })
      }

      closeModal()
      fetchFoods()
    } catch (err) {
      const message = err?.response?.data?.message
      setFormError(Array.isArray(message) ? message[0] : message || 'Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setSaving(false)
    }
  }

  // ---------------------------------------------------------------
  // Toggle / xóa món
  // ---------------------------------------------------------------
  const toggleActive = async (id) => {
    const prev = foods
    setFoods((cur) => cur.map((f) => (f.id === id ? { ...f, isActive: !f.isActive } : f)))
    try {
      await foodService.toggleStatus(id)
    } catch {
      setFoods(prev)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await foodService.remove(deleting.id)
      setDeleting(null)
      fetchFoods()
    } catch (err) {
      setDeleteError(
        err?.response?.data?.message || 'Không thể xóa món ăn này (có thể đang có đơn hàng/đánh giá liên quan)',
      )
    } finally {
      setDeleteLoading(false)
    }
  }

  const viewImages = viewing?.images?.length
    ? viewing.images
    : viewing?.thumbnailUrl
      ? [{ id: 'thumb', imageUrl: viewing.thumbnailUrl }]
      : []

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <Toolbar
            searchPlaceholder="Tìm món ăn..."
            addLabel={canEdit ? 'Thêm món ăn' : undefined}
            onAdd={openCreate}
            searchValue={search}
            onSearchChange={setSearch}
          />
        </div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-surface text-ink-soft focus-ring -mt-4"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-clay/30 bg-clay-light px-4 py-2.5 text-sm text-clay">
          {error}
        </div>
      )}

      <TableCard>
        <Thead columns={['Món ăn', 'Danh mục', 'Giá', 'Hoạt động', 'Thao tác']} />
        <tbody>
          {loading && (
            <tr><td colSpan={5} className="px-5 py-10 text-center text-muted">Đang tải...</td></tr>
          )}
          {!loading && foods.length === 0 && (
            <tr><td colSpan={5} className="px-5 py-10 text-center text-muted">Không có món ăn nào</td></tr>
          )}
          {!loading &&
            foods.map((f) => (
              <Tr key={f.id}>
                <Td>
                  <button
                    onClick={() => openView(f)}
                    className="flex items-center gap-3 text-left hover:opacity-80"
                  >
                    <div className="w-10 h-10 rounded-lg bg-black/[0.04] grid place-items-center shrink-0 overflow-hidden">
                      {f.thumbnailUrl ? (
                        <img src={toImageSrc(f.thumbnailUrl)} alt={f.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageOff size={15} className="text-muted" />
                      )}
                    </div>
                    <span className="font-medium text-ink">{f.name}</span>
                  </button>
                </Td>
                <Td>
                  <span className="px-2 py-1 rounded-md bg-black/[0.04] text-xs text-ink-soft">
                    {getCategoryDisplayName(f, categories)}
                  </span>
                </Td>
                <Td className="font-mono">{currency(f.price)}</Td>
                <Td>
                  <Toggle checked={f.isActive} onChange={() => toggleActive(f.id)} disabled={!canEdit} />
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openView(f)}
                      className="w-8 h-8 grid place-items-center rounded-lg hover:bg-black/[0.04] text-ink-soft"
                      title="Xem chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => openEdit(f)}
                          className="w-8 h-8 grid place-items-center rounded-lg hover:bg-black/[0.04] text-ink-soft"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleting(f)}
                          className="w-8 h-8 grid place-items-center rounded-lg hover:bg-clay-light text-clay"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
        </tbody>
      </TableCard>

      <p className="text-xs text-muted mt-3">
        Không giới hạn số lượng món — dùng công tắc "Hoạt động" để ẩn/hiện món khỏi thực đơn khách hàng mà không cần xoá.
      </p>

      {/* ============================================================= */}
      {/* Modal thêm/sửa món */}
      {/* ============================================================= */}
      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Sửa món ăn' : 'Thêm món ăn'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Danh mục</label>
              <select
                value={String(form.categoryId)}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Giá (đ)</label>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
                placeholder="45000"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Tên món ăn</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              placeholder="Ví dụ: Phở bò tái"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              placeholder="Mô tả ngắn (không bắt buộc)"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Nguyên liệu</label>
            <textarea
              value={form.ingredients}
              onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              placeholder="Không bắt buộc"
            />
          </div>

          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              Hoạt động
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              Món nổi bật
            </label>
          </div>

          {/* ---------------- Ảnh (Uploadcare) ---------------- */}
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Hình ảnh</label>

            {!editing && (
              <>
                <FileUploaderRegular
                  pubkey={UPLOADCARE_PUBLIC_KEY}
                  multiple
                  imgOnly
                  sourceList="local, camera, url"
                  classNameUploader="uc-light"
                  onDoneClick={handleNewUploadSuccess}
                  onFileUploadSuccess={handleNewUploadSuccess}
                />
                {newImageUrls.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {newImageUrls.map((url) => (
                      <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNewImageUrl(url)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 grid place-items-center rounded-full bg-black/60 text-white"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {editing && (
              <>
                <div className="flex flex-wrap gap-2 mb-2">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border group">
                      <img src={toImageSrc(img.imageUrl)} alt="" className="w-full h-full object-cover" />
                      {editing.thumbnailUrl === img.imageUrl && (
                        <span className="absolute bottom-0.5 left-0.5 rounded bg-teal px-1 text-[10px] text-white">
                          Đại diện
                        </span>
                      )}
                      <div className="absolute inset-0 hidden group-hover:flex items-start justify-end gap-0.5 p-0.5 bg-black/20">
                        {editing.thumbnailUrl !== img.imageUrl && (
                          <button
                            type="button"
                            onClick={() => handleSetThumbnail(img.id)}
                            title="Đặt làm ảnh đại diện"
                            className="w-5 h-5 grid place-items-center rounded-full bg-black/60 text-white"
                          >
                            <Star size={11} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(img.id)}
                          title="Xóa ảnh"
                          className="w-5 h-5 grid place-items-center rounded-full bg-black/60 text-white"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <FileUploaderRegular
                  pubkey={UPLOADCARE_PUBLIC_KEY}
                  multiple
                  imgOnly
                  sourceList="local, camera, url"
                  classNameUploader="uc-light"
                  onDoneClick={handleExistingUploadSuccess}
                  onFileUploadSuccess={handleExistingUploadSuccess}
                />
                {imageError && <p className="text-xs text-clay mt-1">{imageError}</p>}
              </>
            )}
          </div>

          {formError && <p className="text-xs text-clay">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm rounded-lg border border-border text-ink-soft hover:bg-black/[0.03] focus-ring"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg bg-ink text-paper hover:bg-ink-soft focus-ring font-medium disabled:opacity-60"
            >
              {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================= */}
      {/* Modal xem chi tiết */}
      {/* ============================================================= */}
      <Modal open={!!viewing} onClose={closeView} title="Chi tiết món ăn">
        {viewing && (
          <div className="space-y-5">
            {/* Gallery ảnh */}
            <div>
              <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-black/[0.04] grid place-items-center">
                {viewImages.length > 0 ? (
                  <img
                    src={toImageSrc(viewImages[activeImageIdx]?.imageUrl)}
                    alt={viewing.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageOff size={32} className="text-muted" />
                )}
              </div>
              {viewImages.length > 1 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {viewImages.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 ${idx === activeImageIdx ? 'border-ink' : 'border-transparent'
                        }`}
                    >
                      <img src={toImageSrc(img.imageUrl)} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Thông tin chính */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-ink">{viewing.name}</h3>
                <span className="text-lg font-mono font-semibold text-ink shrink-0">
                  {currency(viewing.price)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-1 rounded-md bg-black/[0.04] text-xs text-ink-soft">
                  {getCategoryDisplayName(viewing, categories)}
                </span>
                <span
                  className={`px-2 py-1 rounded-md text-xs ${viewing.isActive ? 'bg-teal/10 text-teal' : 'bg-black/[0.04] text-muted'
                    }`}
                >
                  {viewing.isActive ? 'Đang hoạt động' : 'Đã ẩn'}
                </span>
                {viewing.isFeatured && (
                  <span className="px-2 py-1 rounded-md bg-amber-100 text-amber-700 text-xs">
                    Món nổi bật
                  </span>
                )}
              </div>
            </div>

            {viewing.description && (
              <div>
                <h4 className="text-sm font-medium text-ink mb-1">Mô tả</h4>
                <p className="text-sm text-ink-soft whitespace-pre-line">{viewing.description}</p>
              </div>
            )}

            {viewing.ingredients && (
              <div>
                <h4 className="text-sm font-medium text-ink mb-1">Nguyên liệu</h4>
                <p className="text-sm text-ink-soft whitespace-pre-line">{viewing.ingredients}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              {canEdit && (
                <button
                  onClick={() => {
                    closeView()
                    openEdit(viewing)
                  }}
                  className="px-4 py-2 text-sm rounded-lg border border-border text-ink-soft hover:bg-black/[0.03] focus-ring"
                >
                  Sửa món này
                </button>
              )}
              <button
                onClick={closeView}
                className="px-4 py-2 text-sm rounded-lg bg-ink text-paper hover:bg-ink-soft focus-ring font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => {
          setDeleting(null)
          setDeleteError('')
        }}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Xóa món ăn"
        message={deleteError || `Bạn có chắc muốn xóa món "${deleting?.name}"? Hành động này không thể hoàn tác.`}
      />
    </div>
  )
}