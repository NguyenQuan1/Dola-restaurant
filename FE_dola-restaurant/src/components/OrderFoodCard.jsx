import { useState } from 'react'
import { Plus, Minus, Check, ImageOff } from 'lucide-react'

function formatVnd(value) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0)
}

export default function OrderFoodCard({ food, onAdd }) {
    const [qty, setQty] = useState(1)
    const [imgLoaded, setImgLoaded] = useState(false)
    const [justAdded, setJustAdded] = useState(false)

    const increment = () => setQty((q) => q + 1)
    const decrement = () => setQty((q) => Math.max(1, q - 1))

    const handleAdd = () => {
        onAdd(food, qty)
        setQty(1)
        setJustAdded(true)
        setTimeout(() => setJustAdded(false), 900)
    }

    const imageBlock = (
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-jade-700/10 sm:h-36 sm:w-full sm:rounded-none">
            {food.image ? (
                <>
                    {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-jade-700/10" />}
                    <img
                        src={food.image}
                        alt={food.name}
                        onLoad={() => setImgLoaded(true)}
                        className={`h-full w-full object-cover transition-all duration-300 group-hover:scale-105 ${
                            imgLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                    />
                </>
            ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1 text-ink-soft">
                    <ImageOff size={18} className="opacity-50" />
                    <span className="hidden text-[11px] sm:block">Chưa có ảnh</span>
                </div>
            )}
        </div>
    )

    const controlsBlock = (
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 rounded-full bg-ivory px-1.5 py-1 sm:gap-2 sm:px-2">
                <button
                    type="button"
                    onClick={decrement}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-jade-50"
                    aria-label="Giảm số lượng"
                >
                    <Minus size={14} />
                </button>
                <span className="w-4 text-center text-xs font-semibold text-ink sm:w-5">{qty}</span>
                <button
                    type="button"
                    onClick={increment}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-jade-50"
                    aria-label="Tăng số lượng"
                >
                    <Plus size={14} />
                </button>
            </div>

            <button
                type="button"
                onClick={handleAdd}
                disabled={justAdded}
                className={`flex min-w-[56px] shrink-0 items-center justify-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-ivory transition-colors sm:min-w-[64px] sm:px-3 ${
                    justAdded ? 'bg-jade-800' : 'bg-jade-700 hover:bg-jade-800'
                }`}
            >
                {justAdded ? <Check size={14} /> : null}
                {justAdded ? 'Đã thêm' : 'Thêm'}
            </button>
        </div>
    )

    return (
        <div className="group flex h-full gap-3 overflow-hidden rounded-xl2 bg-ivory-deep p-3 shadow-card transition-shadow hover:shadow-lg sm:flex-col sm:gap-0 sm:p-0">
            {imageBlock}

            <div className="flex min-w-0 flex-1 flex-col space-y-1.5 sm:space-y-2 sm:p-4">
                <h3 className="line-clamp-2 min-h-[2.25rem] text-sm font-semibold text-ink sm:min-h-[2.5rem]">
                    {food.name}
                </h3>
                <p className="text-sm font-semibold text-jade-700">{formatVnd(food.price)}</p>
                {controlsBlock}
            </div>
        </div>
    )
}