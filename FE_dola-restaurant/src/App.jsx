import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import PlaceholderPage from './components/PlaceholderPage'
import Home from './pages/Home'
import About from './pages/About'
import Menu from './pages/Menu'
import FoodDetail from './pages/FoodDetail'
import Reservation from './pages/Reservation'
import Promotions from './pages/Promotions'
import News from './pages/News'
import NewsDetail from './pages/NewsDetail'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import VerifyCode from './pages/VerifyCode'
import ResetPassword from './pages/ResetPassword'
import Account from './pages/Account'
import { AuthProvider } from './context/AuthContext'
import GuestRoute from './components/GuestRoute.jsx'
import ChatbotWidget from './components/ChatbotWidget.jsx'

function App() {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gioi-thieu" element={<About />} />

            <Route path="/thuc-don" element={<Menu />} />
            <Route path="/thuc-don/:id" element={<FoodDetail />} />

            <Route path="/dat-ban" element={<Reservation />} />

            <Route path="/khuyen-mai" element={<Promotions />} />

            <Route path="/tin-tuc" element={<News />} />
            <Route path="/tin-tuc/:slug" element={<NewsDetail />} />

            <Route path="/lien-he" element={<Contact />} />

            <Route path="/dang-nhap" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/dang-ky" element={<GuestRoute><Register /></GuestRoute>} />
            <Route path="/quen-mat-khau" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
            <Route path="/xac-thuc-ma" element={<GuestRoute><VerifyCode /></GuestRoute>} />
            <Route path="/dat-lai-mat-khau" element={<GuestRoute><ResetPassword /></GuestRoute>} />
            <Route path="/tai-khoan" element={<Account />} />

            <Route
              path="*"
              element={<PlaceholderPage title="Không tìm thấy trang" description="Trang bạn tìm không tồn tại." />}
            />
          </Routes>
        </main>
        <Footer />
        <ChatbotWidget />
      </div>
    </AuthProvider>
  )
}

export default App
