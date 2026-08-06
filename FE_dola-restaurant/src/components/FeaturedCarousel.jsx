import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatVND } from '../api/foods'

/**
 * FeaturedCarousel — Lướt cực kỳ nhẹ nhàng, mượt mà từng món một.
 * Hiển thị 4 món/hàng và quay vòng vô hạn.
 */
export default function FeaturedCarousel({ dishes }) {
  const totalDishes = dishes ? dishes.length : 0

  // Nhân bản danh sách để tạo vòng lặp vô tận
  const extendedDishes = totalDishes ? [...dishes, ...dishes, ...dishes] : []

  const [currentIndex, setCurrentIndex] = useState(totalDishes)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [isPaused, setIsPaused] = useState(false)

  // Thời gian tạm dừng ở mỗi món (4 giây)
  const SLIDE_INTERVAL = 4000

  // Tự động lướt từng món sang trái
  useEffect(() => {
    if (totalDishes <= 1 || isPaused) return

    const timer = setInterval(() => {
      setIsTransitioning(true)
      setCurrentIndex((prev) => prev + 1)
    }, SLIDE_INTERVAL)

    return () => clearInterval(timer)
  }, [totalDishes, isPaused])

  // Reset vị trí âm thầm khi chạm mốc để giữ vòng lặp vô hạn
  const handleTransitionEnd = () => {
    if (currentIndex >= totalDishes * 2) {
      setIsTransitioning(false)
      setCurrentIndex(currentIndex - totalDishes)
    } else if (currentIndex < totalDishes) {
      setIsTransitioning(false)
      setCurrentIndex(currentIndex + totalDishes)
    }
  }

  if (!totalDishes) return null

  return (
    <div
      className="relative w-full overflow-hidden py-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="w-full overflow-hidden">
        <div
          className="flex w-full"
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translate3d(-${currentIndex * 25}%, 0, 0)`,
            /* Animation lướt cực kỳ nhẹ nhàng & êm ái */
            transition: isTransitioning
              ? 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
              : 'none',
          }}
        >
          {extendedDishes.map((dish, i) => (
            <div
              key={`${dish.id}-${i}`}
              className="w-1/4 flex-shrink-0 px-2.5"
              style={{ boxSizing: 'border-box' }}
            >
              <div className="featured-card h-full">
                <div className="featured-card__img-wrap">
                  <img src={dish.image} alt={dish.name} className="featured-card__img" />
                  <span
                    className={`featured-card__badge ${
                      dish.available
                        ? 'featured-card__badge--active'
                        : 'featured-card__badge--sold'
                    }`}
                  >
                    {dish.available ? 'Còn món' : 'Hết món'}
                  </span>
                </div>
                <div className="featured-card__body">
                  <p className="featured-card__category">{dish.categoryName}</p>
                  <h3 className="featured-card__name">{dish.name}</h3>
                  <p className="featured-card__desc">{dish.desc}</p>
                  <div className="featured-card__footer">
                    <span className="featured-card__price">{formatVND(dish.price)}</span>
                    <Link to={`/thuc-don/${dish.id}`} className="featured-card__link">
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}