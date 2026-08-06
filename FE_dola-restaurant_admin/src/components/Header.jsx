import { Search, Bell, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Header({ title, subtitle }) {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-10 bg-paper/85 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between gap-4 px-8 py-5">
        <div>
          <h1 className="font-display text-2xl text-ink">{title}</h1>
          {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-56 pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-surface focus-ring placeholder:text-muted"
            />
          </div>
          <button className="relative w-9 h-9 grid place-items-center rounded-lg border border-border bg-surface hover:bg-black/[0.03] focus-ring">
            <Bell size={16} className="text-ink-soft" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-clay" />
          </button>
          <div className="flex items-center gap-2 pl-2">
            <div className="w-9 h-9 rounded-full bg-saffron text-ink font-display font-semibold grid place-items-center text-sm">
              {user?.fullName?.[0]?.toUpperCase() || 'D'}
            </div>
            <div className="hidden md:block leading-tight">
              <p className="text-sm font-medium text-ink">{user?.fullName || 'Đang tải...'}</p>
              <p className="text-xs text-muted">{user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</p>
            </div>
            <button
              onClick={() => logout()}
              title="Đăng xuất"
              className="w-9 h-9 grid place-items-center rounded-lg border border-border bg-surface hover:bg-black/[0.03] focus-ring"
            >
              <LogOut size={16} className="text-ink-soft" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
