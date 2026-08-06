import { Link } from 'react-router-dom'
import { formatVND } from '../api/foods'

export default function FoodCard({ food }) {
  return (
    <div className="group overflow-hidden rounded-xl2 bg-ivory shadow-card transition-transform hover:-translate-y-1.5">
      <Link to={`/thuc-don/${food.id}`} className="relative block h-48 overflow-hidden">
        <img
          src={food.image}
          alt={food.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold ${
            food.available ? 'bg-jade-700/90 text-ivory' : 'bg-ink/70 text-ivory'
          }`}
        >
          {food.available ? 'Còn món' : 'Hết món'}
        </span>
        {food.rating > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-ivory/95 px-2.5 py-1 text-[11px] font-semibold text-gold-dark">
            ★ {food.rating}
          </span>
        )}
      </Link>
      <div className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-gold-dark">
          {food.categoryName}
        </p>
        <Link to={`/thuc-don/${food.id}`}>
          <h3 className="mt-1.5 font-display text-lg font-semibold text-jade-700 hover:text-gold-dark">
            {food.name}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">{food.desc}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="font-display text-base font-semibold text-lacquer">
            {formatVND(food.price)}
          </span>
          <Link
            to={`/thuc-don/${food.id}`}
            className="text-sm font-semibold text-jade-700 underline decoration-gold decoration-2 underline-offset-4 hover:text-gold-dark"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  )
}
