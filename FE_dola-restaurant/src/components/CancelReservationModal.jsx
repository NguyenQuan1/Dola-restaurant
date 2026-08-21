import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, Calendar, Clock, Users, Send } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function CancelReservationModal({ isOpen, onClose, onConfirm, reservation, loading }) {
  const { t } = useLanguage()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  if (!isOpen || !reservation) return null

  const quickReasons = t('cancelModal.quickReasons') || [
    'Bận việc đột xuất không thể đến',
    'Thay đổi lịch trình công tác / di chuyển',
    'Muốn thay đổi ngày / giờ đặt bàn khác',
    'Thay đổi số lượng người tham gia',
    'Lý do cá nhân khác',
  ]

  const handleSelectQuickReason = (r) => {
    setReason(r)
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError(t('cancelModal.errorRequired'))
      return
    }
    setError('')
    onConfirm(reservation.id, reason.trim())
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-ivory-deep p-6 shadow-2xl border border-jade-700/10 sm:p-8"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-ink-soft transition-colors hover:bg-black/5 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lacquer/10 text-lacquer">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-jade-700">
                {t('cancelModal.title', { id: reservation.id })}
              </h3>
              <p className="text-xs text-ink-soft">{t('cancelModal.subtitle')}</p>
            </div>
          </div>

          {/* Info Card */}
          <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-ivory p-3.5 text-xs text-ink border border-jade-700/10">
            <div className="flex items-center gap-1.5 font-medium">
              <Calendar className="h-4 w-4 text-jade-700" />
              <span>{reservation.date}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="h-4 w-4 text-gold-dark" />
              <span>{reservation.time}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <Users className="h-4 w-4 text-jade-700" />
              <span>{reservation.guests} {t('account.guests')}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                {t('cancelModal.quickReasonsLabel')}
              </label>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(quickReasons) && quickReasons.map((r, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectQuickReason(r)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      reason === r
                        ? 'bg-lacquer text-ivory shadow-sm'
                        : 'bg-ivory text-ink hover:bg-jade-700/10 border border-jade-700/15'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value)
                  if (error) setError('')
                }}
                placeholder={t('cancelModal.reasonPlaceholder')}
                className="w-full rounded-xl border border-jade-700/20 bg-ivory p-3 text-sm outline-none transition-all focus:border-lacquer focus:ring-1 focus:ring-lacquer/30"
              />
              {error && <p className="mt-1 text-xs font-medium text-lacquer">{error}</p>}
            </div>

            {/* Buttons */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-full px-5 py-2.5 text-xs font-semibold text-ink-soft transition-colors hover:bg-black/5"
              >
                {t('cancelModal.keepBtn')}
              </button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-full bg-lacquer px-6 py-2.5 text-xs font-semibold text-ivory shadow-md transition-all hover:bg-lacquer/90 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{loading ? t('cancelModal.cancelling') : t('cancelModal.confirmBtn')}</span>
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
