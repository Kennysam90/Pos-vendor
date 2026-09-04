import { useState, useCallback, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export type ToastKind = 'success' | 'error' | 'info'

interface ToastItem { id: number; kind: ToastKind; message: string }

let listeners: ((item: ToastItem) => void)[] = []
let counter = 0

export function toast(kind: ToastKind, message: string) {
  const item = { id: ++counter, kind, message }
  listeners.forEach((fn) => fn(item))
}

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    const listener = (item: ToastItem) => {
      setItems((prev) => [...prev, item])
      setTimeout(() => remove(item.id), 4000)
    }
    listeners.push(listener)
    return () => { listeners = listeners.filter((l) => l !== listener) }
  }, [remove])

  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2 pointer-events-none">
      {items.map((t) => {
        const Icon = t.kind === 'success' ? CheckCircle2 : t.kind === 'error' ? AlertCircle : Info
        return (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 rounded-xl bg-white border shadow-soft px-4 py-3 text-sm pointer-events-auto animate-slide-up max-w-sm ${
              t.kind === 'success' ? 'border-emerald-200' : t.kind === 'error' ? 'border-rose-200' : 'border-brand-200'
            }`}
          >
            <Icon size={18} className={t.kind === 'success' ? 'text-emerald-600' : t.kind === 'error' ? 'text-rose-600' : 'text-brand-600'} />
            <span className="text-ink-700 flex-1">{t.message}</span>
            <button onClick={() => remove(t.id)} className="text-ink-300 hover:text-ink-500"><X size={14} /></button>
          </div>
        )
      })}
    </div>
  )
}
