import { NavLink } from 'react-router-dom'
import {
  LayoutGrid,
  Layers,
  UtensilsCrossed,
  CalendarCheck,
  Users,
  UserCog,
  Tag,
  Newspaper,
  Star,
  MessageCircle,
  Mail,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const nav = [
  { to: '/', label: 'Tổng quan', icon: LayoutGrid, end: true, roles: ['admin', 'staff'] },
  { to: '/danh-muc', label: 'Danh mục', icon: Layers, roles: ['admin', 'staff'] },
  { to: '/mon-an', label: 'Món ăn', icon: UtensilsCrossed, roles: ['admin', 'staff'] },
  { to: '/dat-ban', label: 'Đặt bàn', icon: CalendarCheck, roles: ['admin', 'staff'] },
  { to: '/khach-hang', label: 'Khách hàng', icon: Users, roles: ['admin'] },
  { to: '/nhan-vien', label: 'Nhân viên', icon: UserCog, roles: ['admin'] },
  { to: '/khuyen-mai', label: 'Khuyến mãi', icon: Tag, roles: ['admin'] },
  { to: '/tin-tuc', label: 'Tin tức', icon: Newspaper, roles: ['admin'] },
  { to: '/danh-gia', label: 'Đánh giá', icon: Star, roles: ['admin', 'staff'] },
  { to: '/tin-nhan', label: 'Tin nhắn', icon: MessageCircle, roles: ['admin', 'staff'] },
  { to: '/lien-he', label: 'Liên hệ', icon: Mail, roles: ['admin', 'staff'] },
]

export default function Sidebar() {
  const { role } = useAuth()
  const visibleNav = nav.filter((item) => item.roles.includes(role))

  return (
    <aside className="group w-20 hover:w-64 shrink-0 bg-ink text-paper flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out overflow-hidden">
      {/* Header / Logo */}
      <div className="px-4 pt-6 pb-5 relative overflow-hidden flex items-center">
        <svg
          className="absolute -top-2 left-6 opacity-40 transition-opacity duration-300 group-hover:opacity-40 opacity-0"
          width="60"
          height="34"
          viewBox="0 0 60 34"
          fill="none"
        >
          <path d="M6 30C2 24 10 20 6 12C3 6 8 2 8 2" stroke="#C9973F" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M20 30C16 22 24 18 19 10C16 4 21 1 21 1" stroke="#C9973F" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
          <path d="M34 30C30 25 37 19 32 11C29 5 34 2 34 2" stroke="#C9973F" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
        </svg>

        <div className="relative flex items-center gap-2.5">
          <img
            src="https://6d39pwi252.ucarecd.net/ffdbd900-1103-4034-bb75-140e28891dfe/Gemini_Generated_Image_jlcrvpjlcrvpjlcrremovebgpreview.png"
            alt="Logo Dola Restaurant"
            className="h-12 w-12 rounded-full object-cover shrink-0"
          />
          <div className="leading-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <p className="font-display text-2xl leading-none tracking-tight">Dola</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-saffron mt-1.5">Bảng quản trị</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {visibleNav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors ${isActive
                ? 'bg-white/10 text-white font-medium'
                : 'text-paper/60 hover:text-paper hover:bg-white/5'
              }`
            }
          >
            <Icon size={17} strokeWidth={1.75} className="shrink-0" />
            <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Footer / Version */}
      <div className="px-5 py-4 border-t border-white/10 text-xs text-paper/40 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        v0.1 · Dashboard
      </div>
    </aside>
  )
}