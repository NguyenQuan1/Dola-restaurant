import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

/**
 * Sinh URL mà mã QR của một bàn sẽ trỏ tới.
 *
 * Hiện tại trang gọi món (/order/:code) CHƯA tồn tại — đây là placeholder
 * để dành chỗ. Sau này khi có trang gọi món thật, chỉ cần sửa hàm này
 * (hoặc tạo route khớp với nó) là toàn bộ mã QR đã in ra vẫn hoạt động,
 * vì mã bàn (code) không đổi.
 */
export function buildTableOrderUrl(code) {
    const customerBaseUrl = import.meta.env.VITE_CUSTOMER_APP_URL || 'https://dola-restaurant-psi.vercel.app'
    return `${customerBaseUrl}/order/${code}`
}

/**
 * Tải ảnh QR của một bàn xuống dạng file PNG.
 */
export async function downloadTableQr(code, size = 512) {
    const dataUrl = await QRCode.toDataURL(buildTableOrderUrl(code), {
        width: size,
        margin: 1,
        color: { dark: '#1c1917', light: '#ffffff' },
    })
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `qr-ban-${code}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

/**
 * Hiển thị mã QR của một bàn dưới dạng ảnh (data URL), tự sinh khi mount.
 */
export default function TableQrCode({ code, size = 180, className = '' }) {
    const [dataUrl, setDataUrl] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        setDataUrl(null)
        setError('')

        QRCode.toDataURL(buildTableOrderUrl(code), {
            width: size,
            margin: 1,
            color: { dark: '#1c1917', light: '#ffffff' },
        })
            .then((url) => {
                if (!cancelled) setDataUrl(url)
            })
            .catch((err) => {
                console.error('Lỗi sinh mã QR:', err)
                if (!cancelled) setError('Không thể tạo mã QR')
            })

        return () => {
            cancelled = true
        }
    }, [code, size])

    if (error) {
        return <div className={`text-xs text-red-600 ${className}`}>{error}</div>
    }

    if (!dataUrl) {
        return (
            <div
                className={`animate-pulse rounded-lg bg-black/[0.06] ${className}`}
                style={{ width: size, height: size }}
            />
        )
    }

    return (
        <img
            src={dataUrl}
            alt={`Mã QR bàn ${code}`}
            width={size}
            height={size}
            className={`rounded-lg border border-border bg-white p-2 ${className}`}
        />
    )
}