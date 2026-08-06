import Modal from './Modal.jsx'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Xác nhận',
  message,
  confirmLabel = 'Xóa',
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-sm text-ink-soft">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-lg border border-border text-ink-soft hover:bg-black/[0.03] focus-ring"
        >
          Hủy
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onConfirm}
          className="px-4 py-2 text-sm rounded-lg bg-clay text-paper hover:opacity-90 disabled:opacity-60 focus-ring font-medium"
        >
          {loading ? 'Đang xử lý...' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}