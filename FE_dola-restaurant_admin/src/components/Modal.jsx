import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ 
  open, 
  onClose, 
  title, 
  children, 
  maxWidth = 'max-w-4xl' 
}) {
  useEffect(() => {
    if (!open) return

    const handleKey = (e) => e.key === 'Escape' && onClose?.()

    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className={` w-full ${'max-w-3xl'} max-h-[90vh] rounded-xl border border-border bg-surface shadow-card flex flex-col `}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header cố định */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <h3 className="text-sm font-semibold text-ink">
            {title}
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 grid place-items-center rounded-lg hover:bg-black/[0.04] text-muted focus-ring"
          >
            <X size={16} />
          </button>
        </div>


        {/* Nội dung có scroll */}
        <div className="px-5 py-4 overflow-y-auto">
          {children}
        </div>

      </div>
    </div>
  )
}
