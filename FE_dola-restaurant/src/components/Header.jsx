import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { to: '/', label: 'Trang chủ' },
  { to: '/gioi-thieu', label: 'Giới thiệu' },
  { to: '/thuc-don', label: 'Thực đơn' },
  { to: '/khuyen-mai', label: 'Khuyến mãi' },
  { to: '/tin-tuc', label: 'Tin tức' },
  { to: '/lien-he', label: 'Liên hệ' },
]

export default function Header() {
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { user, isAuthenticated } = useAuth()

  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0

    setScrolled(latest > 12)

    if (latest > previous && latest > 100) {
      setHidden(true)
    } else {
      setHidden(false)
    }
  })

  return (
    <>
      {/* 1. Thẻ đệm giúp giữ khoảng trống cho tất cả các trang, tránh bị Header che mất banner */}
      <div className="h-[80px] w-full" />

      {/* 2. Header cố định chạy animation thụt lên / thụt xuống */}
      <motion.header
        variants={{
          visible: { y: '0%' },
          hidden: { y: '-100%' },
        }}
        animate={hidden ? 'hidden' : 'visible'}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
          scrolled
            ? 'bg-ivory/95 shadow-[0_4px_20px_-8px_rgba(30,74,56,0.25)] backdrop-blur'
            : 'bg-ivory/70 backdrop-blur-sm'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="https://6d39pwi252.ucarecd.net/ffdbd900-1103-4034-bb75-140e28891dfe/Gemini_Generated_Image_jlcrvpjlcrvpjlcrremovebgpreview.png"
              alt="Logo Dola Restaurant"
              className="h-12 w-12 rounded-full object-cover"
            />
            <span className="flex flex-col leading-none">
              <span className="font-display text-xl font-semibold tracking-wide text-jade-700">Dola</span>
              <span className="font-script text-sm italic tracking-widest text-gold-dark">Restaurant</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative py-1 text-[15px] font-medium tracking-wide transition-colors hover:text-jade-700 ${
                    isActive ? 'text-jade-700' : 'text-ink-soft'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive && (
                      <span className="absolute -bottom-1 left-0 h-[2px] w-full rounded-full bg-gold" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-5 lg:flex">
            {isAuthenticated ? (
              <Link
                to="/tai-khoan"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-jade-700 font-display text-sm text-gold-light"
                aria-label="Tài khoản"
              >
                {user.fullName[0]}
              </Link>
            ) : (
              <Link
                to="/dang-nhap"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-jade-700/15 text-jade-700 transition-colors hover:bg-jade-700/10"
                aria-label="Đăng nhập"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20 21a8 8 0 1 0-16 0" />
                  <circle cx="12" cy="8" r="4" />
                </svg>
              </Link>
            )}

            <Link
              to="/dat-ban"
              className="rounded-full bg-gradient-to-r from-gold-dark to-gold px-6 py-2.5 text-[15px] font-semibold text-jade-900 shadow-gold transition-transform hover:-translate-y-0.5"
            >
              Đặt bàn ngay
            </Link>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Mở menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-jade-700/20 text-jade-700 lg:hidden"
          >
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
              <path d="M0 1H18" stroke="currentColor" strokeWidth="1.6" />
              <path d="M0 7H18" stroke="currentColor" strokeWidth="1.6" />
              <path d="M0 13H18" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </div>

        {open && (
          <div className="border-t border-jade-700/10 bg-ivory px-6 py-4 lg:hidden">
            <nav className="flex flex-col gap-4">
              {NAV_LINKS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="text-[15px] font-medium text-ink-soft"
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink
                to={isAuthenticated ? '/tai-khoan' : '/dang-nhap'}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-[15px] font-medium text-ink-soft"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20 21a8 8 0 1 0-16 0" />
                  <circle cx="12" cy="8" r="4" />
                </svg>
                <span>{isAuthenticated ? 'Tài khoản của tôi' : 'Đăng nhập'}</span>
              </NavLink>
              <Link
                to="/dat-ban"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-full bg-gradient-to-r from-gold-dark to-gold px-6 py-2.5 text-center text-[15px] font-semibold text-jade-900"
              >
                Đặt bàn ngay
              </Link>
            </nav>
          </div>
        )}
      </motion.header>
    </>
  )
}