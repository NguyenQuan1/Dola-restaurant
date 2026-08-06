import { useEffect, useState } from 'react'
import { Star, MessageSquare, Eye, EyeOff, Send, X } from 'lucide-react'
import Toolbar from '../components/Toolbar.jsx'
import { TableCard, Thead, Tr, Td } from '../components/Table.jsx'
import reviewsService from '../api/reviews.js'

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={i < rating ? 'fill-saffron text-saffron' : 'text-border'}
        />
      ))}
    </div>
  )
}

export default function Reviews() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedReview, setSelectedReview] = useState(null)
  const [replyInput, setReplyInput] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [search, setSearch] = useState('')
  const [togglingId, setTogglingId] = useState(null)

  const fetchReviews = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await reviewsService.getAll()
      setRows(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách đánh giá từ server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const handleOpenDetail = (review) => {
    setSelectedReview(review)
    setReplyInput('')
  }

  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!replyInput.trim() || !selectedReview) return

    setSubmittingReply(true)
    try {
      const newReply = await reviewsService.reply(selectedReview.id, replyInput.trim())

      setRows((prev) =>
        prev.map((r) =>
          r.id === selectedReview.id
            ? { ...r, replies: [...(r.replies || []), newReply] }
            : r
        )
      )

      setSelectedReview((prev) => ({
        ...prev,
        replies: [...(prev.replies || []), newReply],
      }))

      setReplyInput('')
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể gửi phản hồi. Vui lòng thử lại.')
    } finally {
      setSubmittingReply(false)
    }
  }

  const handleToggleApprove = async (id) => {
    setTogglingId(id)
    try {
      const updated = await reviewsService.toggleApprove(id)

      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isApproved: updated.isApproved } : r))
      )

      setSelectedReview((prev) =>
        prev && prev.id === id ? { ...prev, isApproved: updated.isApproved } : prev
      )
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể cập nhật trạng thái đánh giá.')
    } finally {
      setTogglingId(null)
    }
  }

  const filteredRows = rows.filter((r) => {
    const customerName = r.user?.fullName || r.customer || ''
    const foodName = r.food?.name || r.food || ''
    const commentText = r.comment || ''
    const q = search.toLowerCase()

    return (
      customerName.toLowerCase().includes(q) ||
      foodName.toLowerCase().includes(q) ||
      commentText.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <Toolbar
        searchPlaceholder="Tìm theo khách hàng, món ăn..."
        searchValue={search}
        onSearchChange={(e) => setSearch(e.target.value)}
      />

      {error && (
        <p className="mb-3 text-sm text-clay bg-clay-light rounded-lg px-3 py-2.5">
          {error}
        </p>
      )}

      <TableCard>
        <Thead columns={['ID', 'Khách hàng', 'Món ăn', 'Đánh giá', 'Bình luận', 'Phản hồi', 'Thao tác']} />
        <tbody>
          {loading ? (
            <Tr>
              <Td colSpan={7} className="text-center text-muted py-6">
                Đang tải danh sách đánh giá...
              </Td>
            </Tr>
          ) : filteredRows.length === 0 ? (
            <Tr>
              <Td colSpan={7} className="text-center text-muted py-6">
                Chưa có đánh giá nào.
              </Td>
            </Tr>
          ) : (
            filteredRows.map((r) => {
              const customerName = r.user?.fullName || r.customer || 'Khách hàng'
              const foodName = r.food?.name || r.food || 'Món ăn'
              const replyCount = r.replies?.length || 0

              return (
                <Tr key={r.id}>
                  <Td className="font-mono text-xs text-muted">
                    #{r.id}
                    {!r.isApproved && (
                      <span className="block mt-0.5 text-[10px] font-sans font-medium text-clay">
                        Đã ẩn
                      </span>
                    )}
                  </Td>
                  <Td className="font-medium text-ink">{customerName}</Td>
                  <Td>{foodName}</Td>
                  <Td>
                    <Stars rating={r.rating} />
                  </Td>
                  <Td className="max-w-xs text-xs text-muted truncate">{r.comment}</Td>
                  <Td>
                    <span className="inline-flex items-center gap-1 text-xs text-teal font-medium bg-teal-light/50 px-2 py-0.5 rounded">
                      <MessageSquare size={12} />
                      {replyCount} phản hồi
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDetail(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-paper bg-teal hover:bg-teal-dark rounded-lg transition-colors"
                      >
                        <Eye size={13} />
                        Xem & Rep
                      </button>
                      <button
                        onClick={() => handleToggleApprove(r.id)}
                        disabled={togglingId === r.id}
                        title={r.isApproved ? 'Ẩn đánh giá này' : 'Hiện đánh giá này'}
                        className={
                          r.isApproved
                            ? 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-clay bg-clay-light hover:bg-clay-light/70 disabled:opacity-50 rounded-lg transition-colors'
                            : 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal bg-teal-light/50 hover:bg-teal-light disabled:opacity-50 rounded-lg transition-colors'
                        }
                      >
                        {r.isApproved ? <EyeOff size={13} /> : <Eye size={13} />}
                        {togglingId === r.id ? '...' : r.isApproved ? 'Ẩn' : 'Hiện'}
                      </button>
                    </div>
                  </Td>
                </Tr>
              )
            })
          )}
        </tbody>
      </TableCard>

      {/* MODAL XEM CHI TIẾT & REP COMMENT */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-surface rounded-2xl border border-border shadow-card overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-paper/50">
              <div>
                <h3 className="font-display text-lg text-ink font-semibold">
                  Chi tiết đánh giá #{selectedReview.id}
                </h3>
                <p className="text-xs text-muted">
                  Bởi {selectedReview.user?.fullName || selectedReview.customer || 'Khách hàng'} •{' '}
                  {selectedReview.createdAt
                    ? new Date(selectedReview.createdAt).toLocaleString('vi-VN')
                    : (selectedReview.date || '')}
                </p>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-black/5"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Modal */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Thông tin món & Rating */}
              <div className="p-4 rounded-xl bg-paper border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-saffron">
                    {selectedReview.food?.name || selectedReview.food || 'Món ăn'}
                  </span>
                  <Stars rating={selectedReview.rating} />
                </div>
                <p className="text-sm text-ink font-medium leading-relaxed">
                  "{selectedReview.comment}"
                </p>
              </div>

              {/* Danh sách các phản hồi đã có */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <MessageSquare size={13} />
                  Lịch sử phản hồi ({selectedReview.replies?.length || 0})
                </h4>

                {!selectedReview.replies || selectedReview.replies.length === 0 ? (
                  <p className="text-xs text-muted italic">Chưa có phản hồi nào cho bình luận này.</p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedReview.replies.map((reply, idx) => {
                      const authorName = reply.user?.fullName || reply.author || 'Nhà hàng Dola'
                      const dateStr = reply.createdAt
                        ? new Date(reply.createdAt).toLocaleString('vi-VN')
                        : (reply.date || '')

                      return (
                        <div key={reply.id || idx} className="p-3.5 rounded-xl bg-teal-light/30 border border-teal/20 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-teal">{authorName}</span>
                            <span className="text-[10px] text-muted">{dateStr}</span>
                          </div>
                          <p className="text-xs text-ink leading-relaxed">{reply.replyText || reply.comment}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal: Form Rep Comment */}
            <form onSubmit={handleSendReply} className="p-4 border-t border-border bg-paper/30 space-y-3">
              <label className="block text-xs font-medium text-ink">Trả lời bình luận này:</label>
              <div className="flex gap-2">
                <textarea
                  required
                  rows={2}
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder="Nhập nội dung phản hồi của nhà hàng..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-border bg-surface outline-none focus:border-teal transition-colors"
                />
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="self-end px-4 py-2 text-xs font-semibold text-paper bg-saffron hover:bg-saffron-dark disabled:opacity-50 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Send size={13} />
                  {submittingReply ? 'Đang gửi...' : 'Gửi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}