import { Link } from 'react-router-dom'

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z" />
    </svg>
  )
}

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function ZaloIcon(props) {
  return (
    <svg viewBox="0 0 48 48" fill="currentColor" {...props}>
      <path d="M24 4C12.954 4 4 12.06 4 22c0 5.68 2.92 10.74 7.47 14.02-.24 2.02-1.02 4.6-2.6 7.02 0 0 4.66-1.02 8.6-3.66C19.9 39.8 21.9 40 24 40c11.046 0 20-8.06 20-18S35.046 4 24 4z" />
    </svg>
  )
}

const socials = [
  { name: 'Facebook', href: '#', Icon: FacebookIcon },
  { name: 'Instagram', href: '#', Icon: InstagramIcon },
  { name: 'Zalo', href: '#', Icon: ZaloIcon },
]

export default function Footer() {
  return (
    <footer className="bg-jade-900 text-ivory">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
        <div>
          {/* <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/60 font-display text-lg text-gold-light">
              D
            </span>
            <div className="flex flex-col leading-none">
              <span className="font-display text-xl font-semibold text-ivory">Dola</span>
              <span className="font-script text-sm italic tracking-widest text-gold-light">Restaurant</span>
            </div>
          </div> */}
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="https://6d39pwi252.ucarecd.net/ffdbd900-1103-4034-bb75-140e28891dfe/Gemini_Generated_Image_jlcrvpjlcrvpjlcrremovebgpreview.png"
              alt="Logo Dola Restaurant"
              className="h-12 w-12 rounded-full object-cover"
            />
            <span className="flex flex-col leading-none">
              <span className="font-display text-xl font-semibold text-ivory">Dola</span>
              <span className="font-script text-sm italic tracking-widest text-gold-light">Restaurant</span>
            </span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-ivory/60">
            Gìn giữ hương vị quê nhà qua từng món ăn — từ gánh phở sớm mai đến mâm cơm sum vầy.
          </p>
          <div className="mt-5 flex gap-3">
            {socials.map((item) => {
              const Icon = item.Icon
              return (
                <a
                  key={item.name}
                  href={item.href}
                  aria-label={item.name}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ivory/20 text-ivory/70 transition-colors hover:border-gold hover:text-gold-light"
                >
                  <Icon className="h-4 w-4" />
                </a>
              )
            })}
          </div>
        </div>

        <div>
          <h4 className="font-display text-base font-semibold text-gold-light">Liên kết nhanh</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-ivory/65">
            <li><Link to="/gioi-thieu" className="hover:text-gold-light">Giới thiệu</Link></li>
            <li><Link to="/thuc-don" className="hover:text-gold-light">Thực đơn</Link></li>
            <li><Link to="/khuyen-mai" className="hover:text-gold-light">Khuyến mãi</Link></li>
            <li><Link to="/tin-tuc" className="hover:text-gold-light">Tin tức</Link></li>
            <li><Link to="/dat-ban" className="hover:text-gold-light">Đặt bàn</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base font-semibold text-gold-light">Giờ mở cửa</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-ivory/65">
            <li className="flex justify-between gap-4"><span>Thứ 2 - Thứ 6</span><span>9:00 - 22:00</span></li>
            <li className="flex justify-between gap-4"><span>Thứ 7 - Chủ nhật</span><span>8:00 - 23:00</span></li>
            <li className="flex justify-between gap-4"><span>Ngày lễ, Tết</span><span>8:00 - 23:00</span></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base font-semibold text-gold-light">Liên hệ</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-ivory/65">
            <li>123 Đường Trần Phú, Hải Châu, Đà Nẵng</li>
            <li>Hotline: 0905 123 456</li>
            <li>Email: hello@dolarestaurant.vn</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 text-xs text-ivory/50 sm:flex-row lg:px-10">
          <p>© {new Date().getFullYear()} Dola Restaurant. Đã đăng ký bản quyền.</p>
          <p>Thiết kế với ❤ dành cho ẩm thực Việt</p>
        </div>
      </div>
    </footer>
  )
}