import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import Header from '../components/Header.jsx'

const TITLES = {
  '/': ['Tổng quan', 'Hoạt động kinh doanh hôm nay'],
  '/danh-muc': ['Danh mục món ăn', 'Quản lý nhóm món trên thực đơn'],
  '/mon-an': ['Món ăn', 'Quản lý toàn bộ món trong thực đơn'],
  '/dat-ban': ['Đặt bàn', 'Yêu cầu đặt bàn từ khách hàng'],
  '/quan-ly-ban': ['Quản lý bàn', 'Danh sách bàn và tình trạng hiện tại'],
  '/dat-mon&thanh-toan': ['Đặt món & Thanh toán', 'Quản lý đặt món và thanh toán tại nhà hàng'],
  '/khach-hang': ['Khách hàng', 'Danh sách khách hàng đã đăng ký'],
  '/nhan-vien': ['Nhân viên', 'Quản lý nhân sự nhà hàng'],
  '/khuyen-mai': ['Khuyến mãi', 'Voucher, combo và chương trình giảm giá'],
  '/tin-tuc': ['Tin tức', 'Bài viết và thông báo'],
  '/danh-gia': ['Đánh giá', 'Phản hồi của khách hàng'],
}

export default function AdminLayout() {
  const { pathname } = useLocation()
  const [title, subtitle] = TITLES[pathname] || ['Quản trị', '']

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Header title={title} subtitle={subtitle} />
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
