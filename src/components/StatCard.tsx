interface Props {
  label: string
  value: string
  icon: React.ReactNode
  accent?: string
}

export function StatCard({ label, value, icon, accent = 'text-brand-600' }: Props) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-ink-500">{label}</span>
        <span className={accent}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-ink-900">{value}</p>
    </div>
  )
}
