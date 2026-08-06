export default function StatCard({ label, value, delta, deltaPositive = true, icon: Icon, accent = 'saffron' }) {
  const accentMap = {
    saffron: 'bg-saffron-light text-saffron-dark',
    teal: 'bg-teal-light text-teal',
    clay: 'bg-clay-light text-clay',
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted">{label}</p>
        <div className={`w-9 h-9 rounded-lg grid place-items-center ${accentMap[accent]}`}>
          <Icon size={16} strokeWidth={1.75} />
        </div>
      </div>
      <p className="font-mono text-[26px] font-medium text-ink mt-3 tracking-tight">{value}</p>
      {delta && (
        <p className={`text-xs mt-1.5 ${deltaPositive ? 'text-teal' : 'text-clay'}`}>
          {deltaPositive ? '↑' : '↓'} {delta} so với hôm qua
        </p>
      )}
    </div>
  )
}
