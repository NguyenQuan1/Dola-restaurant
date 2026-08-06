const STYLES = {
  active: 'bg-teal-light text-teal',
  confirmed: 'bg-teal-light text-teal',
  completed: 'bg-teal-light text-teal',
  approved: 'bg-teal-light text-teal',
  published: 'bg-teal-light text-teal',
  ongoing: 'bg-teal-light text-teal',

  pending: 'bg-saffron-light text-saffron-dark',
  processing: 'bg-saffron-light text-saffron-dark',
  paused: 'bg-saffron-light text-saffron-dark',

  inactive: 'bg-black/5 text-muted',
  cancelled: 'bg-clay-light text-clay',
  expired: 'bg-clay-light text-clay',
  draft: 'bg-black/5 text-muted',
}

const LABELS = {
  active: 'Hoạt động',
  inactive: 'Ngừng',
  confirmed: 'Đã xác nhận',
  pending: 'Chờ xác nhận',
  cancelled: 'Đã huỷ',
  completed: 'Hoàn tất',
  processing: 'Đang xử lý',
  approved: 'Đã duyệt',
  published: 'Đã đăng',
  draft: 'Bản nháp',
  ongoing: 'Đang diễn ra',
  paused: 'Tạm dừng',
  expired: 'Hết hạn',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STYLES[status] || 'bg-black/5 text-muted'}`}>
      {LABELS[status] || status}
    </span>
  )
}