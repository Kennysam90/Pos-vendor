import { Loader2 } from 'lucide-react'

export function Loading({ label, full }: { label?: string; full?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${full ? 'min-h-screen' : 'py-20'}`}>
      <Loader2 size={24} className="animate-spin text-brand-500" />
      {label && <p className="text-sm text-ink-500">{label}</p>}
    </div>
  )
}
