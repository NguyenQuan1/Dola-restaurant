import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthWatcher() {
  const { lockedMessage } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!lockedMessage) return
    if (location.pathname !== '/dang-nhap') {
      navigate('/dang-nhap', { replace: true, state: { from: location.pathname } })
    }
  }, [lockedMessage])

  return null


  return (
    <div className="fixed top-4 left-1/2 z-[100] w-[92%] max-w-md -translate-x-1/2 rounded-xl bg-lacquer px-5 py-3.5 text-sm font-medium text-ivory shadow-lg animate-[dola-toast_0.25s_ease-out]">
      <div className="flex items-center justify-between gap-3">
        <span>{lockedMessage}</span>
        <button onClick={clearLockedMessage} className="text-ivory/70 hover:text-ivory">✕</button>
      </div>
      <style>{`
        @keyframes dola-toast {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  )
}