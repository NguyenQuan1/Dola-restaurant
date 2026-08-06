import { Search, Plus, SlidersHorizontal } from 'lucide-react'

export default function Toolbar({
  searchPlaceholder = 'Tìm kiếm...',
  addLabel,
  onAdd,
  filters,
  searchValue,
  onSearchChange,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={onSearchChange ? (e) => onSearchChange(e.target.value) : undefined}
            className="w-64 pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-surface focus-ring placeholder:text-muted"
          />
        </div>
        {filters && (
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-border bg-surface text-ink-soft hover:bg-black/[0.03] focus-ring">
            <SlidersHorizontal size={14} />
            Lọc
          </button>
        )}
      </div>
      {addLabel && (
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-ink text-paper hover:bg-ink-soft focus-ring font-medium"
        >
          <Plus size={15} />
          {addLabel}
        </button>
      )}
    </div>
  )
}