import { Routes, Route } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout.jsx'
import Login from './pages/Login.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Categories from './pages/Categories.jsx'
import Foods from './pages/Foods.jsx'
import Reservations from './pages/Reservations.jsx'
import Customers from './pages/Customers.jsx'
import Staff from './pages/Staff.jsx'
import Promotions from './pages/Promotions.jsx'
import News from './pages/News.jsx'
import Reviews from './pages/Reviews.jsx'
import GuestRoute from './components/GuestRoute.jsx'
import Contacts from './pages/Contacts.jsx'
import Messages from './pages/Messages.jsx'

export default function App() {
  return (
    <Routes>
      {/* Trang đăng nhập — không nằm trong AdminLayout, không cần đăng nhập để xem */}
      <Route path="/dang-nhap" element={<GuestRoute><Login /></GuestRoute>} />

      {/* Mọi route bên trong đều yêu cầu đã đăng nhập bằng tài khoản admin hoặc staff */}
      <Route
        element={
          <ProtectedRoute roles={['admin', 'staff']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/danh-muc" element={<Categories />} />
        <Route path="/mon-an" element={<Foods />} />
        <Route path="/dat-ban" element={<Reservations />} />
        <Route path="/khach-hang" element={<Customers />} />
        <Route path="/danh-gia" element={<Reviews />} />
        <Route path="/lien-he" element={<Contacts />} />
        <Route path="/tin-nhan" element={<Messages />} />

        {/* Các trang chỉ admin được vào — staff gõ thẳng URL cũng bị chặn */}
        <Route
          path="/nhan-vien"
          element={
            <ProtectedRoute roles={['admin']}>
              <Staff />
            </ProtectedRoute>
          }
        />
        <Route
          path="/khuyen-mai"
          element={
            <ProtectedRoute roles={['admin']}>
              <Promotions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tin-tuc"
          element={
            <ProtectedRoute roles={['admin']}>
              <News />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}
