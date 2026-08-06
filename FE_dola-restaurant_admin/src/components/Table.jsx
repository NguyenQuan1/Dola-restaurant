export function TableCard({ children }) {
  return (
    <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

export function Thead({ columns }) {
  return (
    <thead>
      <tr className="border-b border-border bg-black/[0.015]">
        {columns.map((col) => (
          <th key={col} className="text-left font-medium text-muted text-xs uppercase tracking-wide px-5 py-3">
            {col}
          </th>
        ))}
      </tr>
    </thead>
  )
}

export function Tr({ children }) {
  return <tr className="border-b border-border last:border-0 hover:bg-black/[0.012]">{children}</tr>
}

export function Td({ children, className = '' }) {
  return <td className={`px-5 py-3.5 align-middle text-ink-soft ${className}`}>{children}</td>
}
