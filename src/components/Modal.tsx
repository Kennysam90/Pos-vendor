import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative card w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-ink-100">
          <h2 className="text-lg font-bold text-ink-900">{title}</h2>
          <button onClick={onClose} className="btn-ghost px-2 py-1.5"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
