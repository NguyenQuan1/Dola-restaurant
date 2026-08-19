import { useEffect, useMemo, useState } from 'react'
import { Printer, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import tableService from '../api/table.js'
import TableQrCode, { downloadTableQr } from '../components/TableQrCode.jsx'

/**
 * Trang in mã QR cho toàn bộ các bàn — dùng để dán lên bàn thật trước khi
 * trang gọi món (/order/:code) hoàn thiện. Chỉ cần bấm "In" là trình duyệt
 * sẽ mở hộp thoại in với bố cục đã được canh riêng cho khổ giấy A4.
 */
export default function InQrTatCaBan() {
    const [tables, setTables] = useState([])
    const [loading, setLoading] = useState(true)
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        tableService
            .getAll()
            .then((list) => {
                if (!cancelled) setTables(Array.isArray(list) ? list : [])
            })
            .catch((err) => {
                console.error('Lỗi tải danh sách bàn:', err)
                if (!cancelled) setErrorMsg('Không thể tải danh sách bàn từ server.')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [])

    const byFloor = useMemo(() => {
        const groups = {}
        for (const t of tables) {
            const f = Number(t.floor) || 1
            if (!groups[f]) groups[f] = []
            groups[f].push(t)
        }
        for (const f of Object.keys(groups)) {
            groups[f].sort((a, b) => (a.code || '').localeCompare(b.code || '', undefined, { numeric: true }))
        }
        return groups
    }, [tables])

    const handleDownloadAll = async () => {
        for (const t of tables) {
            // eslint-disable-next-line no-await-in-loop
            await downloadTableQr(t.code)
        }
    }

    return (
        <div className="mx-auto max-w-5xl p-6">
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .qr-card { break-inside: avoid; page-break-inside: avoid; }
                }
            `}</style>

            <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
                <Link to="/quan-ly-ban" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:underline">
                    <ArrowLeft size={16} /> Quay lại sơ đồ bàn
                </Link>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleDownloadAll}
                        disabled={loading || tables.length === 0}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink-soft hover:bg-black/[0.03] disabled:opacity-50"
                    >
                        Tải tất cả (PNG)
                    </button>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        disabled={loading || tables.length === 0}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft disabled:opacity-50"
                    >
                        <Printer size={16} /> In mã QR
                    </button>
                </div>
            </div>

            <h1 className="no-print mb-1 text-lg font-semibold text-ink">Mã QR các bàn</h1>
            <p className="no-print mb-6 text-xs text-muted">
                Mỗi mã QR hiện trỏ tới đường dẫn tạm <code>/order/&lt;mã bàn&gt;</code> — sẽ hoạt động đầy đủ khi trang gọi món được hoàn thiện.
            </p>

            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
            {loading && <p className="text-sm text-muted">Đang tải danh sách bàn...</p>}

            {Object.keys(byFloor)
                .sort((a, b) => Number(a) - Number(b))
                .map((floor) => (
                    <div key={floor} className="mb-8">
                        <h2 className="no-print mb-3 text-sm font-semibold text-ink-soft">Tầng {floor}</h2>
                        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                            {byFloor[floor].map((t) => (
                                <div
                                    key={t.id || t.code}
                                    className="qr-card flex flex-col items-center gap-2 rounded-xl border border-border p-5 text-center"
                                >
                                    <TableQrCode code={t.code} size={220} />
                                    <span className="text-sm font-semibold text-ink">Bàn {t.code}</span>
                                    <span className="text-xs text-muted">{t.capacity} chỗ · Tầng {t.floor}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
        </div>
    )
}